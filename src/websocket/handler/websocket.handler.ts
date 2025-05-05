import {
  createMessage,
  getAllMessage,
  getMessageById,
} from "../../services/message.service";
import { CreateMessageDto } from "../../dtos/request/message.dto";
import { getUserById } from "../../repositories/user.repository";
import { getCachedUserName } from "../../services/cache.service";
import { createNewNotification } from "../../services/notification.service";
import { NotificationType } from "../../models/enums";
import {
  getUnreadCount,
  markConversationAsRead,
} from "../../services/conversation-read.service";

interface WebSocketMessage {
  type: string; // Loại message: SEND_MESSAGE, TYPING, REQUEST_HISTORY,...
  content?: string;
  page?: number;
  limit?: number;
  mediaIds?: string[];
  [key: string]: any;
}
export enum MessageType {
  SEND_MESSAGE = "SEND_MESSAGE",
  TYPING = "TYPING",
  REQUEST_HISTORY = "REQUEST_HISTORY",
  MARK_AS_READ = "MARK_AS_READ",
  HISTORY = "HISTORY",
  MESSAGES_READ = "MESSAGES_READ",
}

export class WebSocketHandler {
  private sessions: Map<string, WebSocket>;

  constructor(sessions: Map<string, WebSocket>) {
    this.sessions = sessions;
  }
  async handleWebSocketMessage(
    socket: WebSocket,
    message: string,
    env: Env,
    conversationId: string,
    userId: string,
    businessId: string,
    isAdmin: boolean,
    broadcast: (message: string) => void,
    broadcastExcept: (message: string, excludedId: string) => void
  ): Promise<void> {
    try {
      const data: WebSocketMessage = JSON.parse(message);
      if (!data.type) {
        socket.send(JSON.stringify({ error: "Missing message type" }));
        return;
      }

      switch (data.type) {
        case MessageType.SEND_MESSAGE:
          await this.handleSendMessage(
            socket,
            data,
            env,
            conversationId,
            userId,
            businessId,
            isAdmin,
            broadcast,
            broadcastExcept
          );
          break;
        case MessageType.TYPING:
          await this.handleTyping(
            socket,
            data,
            env,
            userId,
            isAdmin,
            broadcastExcept
          );
          break;
        case MessageType.REQUEST_HISTORY:
          await this.handleRequestHistory(socket, data, env, conversationId);
          break;
        case MessageType.MARK_AS_READ:
          await this.handleMarkAsRead(
            env,
            socket,
            conversationId,
            userId,
            broadcast
          );
          break;
        default:
          socket.send(JSON.stringify({ error: "Unknown message type" }));
      }
    } catch (err) {
      console.error("Error handling WebSocket message:", err);
      socket.send(JSON.stringify({ error: "Internal server error" }));
    }
  }

  // Handler cho SEND_MESSAGE
  private async handleSendMessage(
    socket: WebSocket,
    data: WebSocketMessage,
    env: Env,
    conversationId: string,
    userId: string,
    businessId: string,
    isAdmin: boolean,
    broadcast: (message: string) => void,
    broadcastExcept: (message: string, excludedId: string) => void
  ) {
    if (!data.content && (!data.mediaIds || data.mediaIds.length === 0)) {
      socket.send(
        JSON.stringify({ error: "Missing message content or media" })
      );
      return;
    }

    const messageDto: CreateMessageDto = {
      conversationId,
      content: data.content || "",
      senderType: isAdmin ? "ADMIN" : "CLIENT",
      userId,
      mediaIds: data.mediaIds,
      chatType: "",
    };

    const message = await createMessage(env, messageDto);
    const senderName = message.user.name;
    const senderIdentifier = isAdmin ? `admin:${userId}` : `client:${userId}`;
    const recipientId = isAdmin ? `client:${userId}` : `admin:${userId}`;

    const recipientSocket = this.sessions.get(recipientId);
    const newMessage = JSON.stringify({
      type: "NEW_MESSAGE",
      message: {
        id: message.id,
        content: message.content,
        senderType: message.senderType,
        userId,
        conversationId,
        createdAt: message.createdAt,
        media:
          message.messageOnMedia?.map((item) => ({
            id: item.media?.id,
            url: item.media?.url,
          })) || [],
      },
    });

    broadcast(newMessage);
    console.log("Broadcasting message:", recipientSocket);
    if (!recipientSocket) {
      // Người nhận offline: Lưu notification
      const notificationData = {
        userId: message.user.id,
        title: "New message",
        content: message.content || "Sent an image",
        type: NotificationType.NEW_MESSAGE,
        conversationId,
      };
      await createNewNotification(env, notificationData);

      // Gửi thông báo tới NotificationRoom DO
      const notifyData = {
        userId: message.user.id,
        businessId,
        role: isAdmin ? "CLIENT" : "ADMIN",
        type: NotificationType.NEW_MESSAGE,
        senderType: message.senderType,
        payload: {
          conversationId,
          guestName: senderName,
          message: message.content || "Sent an image",
          timestamp: message.createdAt || new Date().toISOString(),
        },
      };

      const notificationRoomId = env.NOTIFICATION_ROOM.idFromName(businessId);
      const notificationRoomStub =
        env.NOTIFICATION_ROOM.get(notificationRoomId);

      await notificationRoomStub.fetch("https://dummy/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(notifyData),
      });
    } else {
      // Người nhận đang online: gửi real-time
      const notificationMessage = JSON.stringify({
        type: "NOTIFICATION",
        conversationId,
        guestName: senderName,
        message: message.content || "Sent an image",
        timestamp: message.createdAt || new Date().toISOString(),
      });

      broadcastExcept(notificationMessage, senderIdentifier);
    }
  }

  // Handler cho TYPING
  private async handleTyping(
    socket: WebSocket,
    data: WebSocketMessage,
    env: Env,
    userId: string,
    isAdmin: boolean,
    broadcastExcept: (message: string, excludedId: string) => void
  ) {
    try {
      const senderIdentifier = isAdmin ? `admin:${userId}` : `client:${userId}`;
      const displayName = await getCachedUserName(env, userId);

      const typingMessage = JSON.stringify({
        type: MessageType.TYPING,
        name: displayName,
        isAdmin,
      });

      broadcastExcept(typingMessage, senderIdentifier);
    } catch (err) {
      console.error("Error handling TYPING event:", err);
    }
  }

  private async handleMarkAsRead(
    env: Env,
    socket: WebSocket,
    conversationId: string,
    userId: string,
    broadcast: (message: string) => void
  ) {
    if (!conversationId) {
      socket.send(JSON.stringify({ error: "Missing conversation ID" }));
      return;
    }

    try {
      // Cập nhật hoặc tạo bản ghi ConversationRead
      const readRecord = await markConversationAsRead(
        env,
        conversationId,
        userId
      );

      // Tạo thông báo WebSocket
      const readMessage = JSON.stringify({
        type: MessageType.MESSAGES_READ,
        conversationId,
        readBy: userId,
        lastReadAt: readRecord.lastReadAt.toISOString(),
      });

      // Phát thông báo tới tất cả client
      broadcast(readMessage);
    } catch (err) {
      console.error("Error marking messages as read:", err);
      socket.send(JSON.stringify({ error: "Failed to mark messages as read" }));
    }
  }

  // Handler cho REQUEST_HISTORY
  private async handleRequestHistory(
    socket: WebSocket,
    data: WebSocketMessage,
    env: Env,
    conversationId: string
  ) {
    const page = data.page || 1;
    const limit = data.limit || 10;
    const conversation = await getAllMessage(env, conversationId, page, limit);

    if (conversation?.messages) {
      socket.send(
        JSON.stringify({
          type: MessageType.HISTORY,
          messages: conversation.messages.map((m) => ({
            id: m.id,
            content: m.content,
            senderType: m.senderType,
            createdAt: m.createdAt,
            media:
              m.media?.map((item) => ({
                id: item?.id,
                url: item?.url,
              })) || [],
          })),
        })
      );
    } else {
      socket.send(JSON.stringify({ error: "Conversation not found" }));
    }
  }

  // Khởi tạo kết nối WebSocket
  async initializeWebSocketConnection(
    socket: WebSocket,
    env: Env,
    conversationId: string,
    userId: string
  ): Promise<void> {
    try {
      const messagesExisting = await getAllMessage(env, conversationId);
      const unreadCount = await getUnreadCount(env, conversationId, userId);
      if (messagesExisting?.messages) {
        socket.send(
          JSON.stringify({
            type: MessageType.HISTORY,
            messages: messagesExisting.messages.map((m) => ({
              id: m.id,
              content: m.content,
              senderType: m.senderType,
              createdAt: m.createdAt,
              media:
                m.media?.map((item) => ({
                  id: item?.id,
                  url: item?.url,
                })) || [],
            })),
            unreadCount,
          })
        );
      }
    } catch (err) {
      console.error("Error sending history:", err);
      socket.send(JSON.stringify({ error: "Failed to load history" }));
    }
  }
}
