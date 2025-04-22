import {
  createMessage,
  getAllMessage,
  getMessageById,
} from "../../services/message.service";
import { CreateMessageDto } from "../../dtos/request/message.dto";
import { getUserById } from "../../repositories/user.repository";
import { createNewNotification } from "../../services/notification.service";
import { NotificationType } from "../../models/enums";

interface WebSocketMessage {
  type: string; // Loại message: SEND_MESSAGE, TYPING, REQUEST_HISTORY,...
  content?: string;
  page?: number;
  limit?: number;
  mediaIds?: string[];
  [key: string]: any;
}

// WebSocket handler class to manage sessions
export class WebSocketHandler {
  // Hàm xử lý khi một tin nhắn được gửi tới WebSocket
  async handleWebSocketMessage(
    socket: WebSocket,
    message: string, // Chuỗi message dạng JSON từ client gửi lên
    env: Env,
    conversationId: string,
    userId: string | null,
    isAdmin: boolean,
    broadcast: (message: string) => void,
    broadcastExcept: (message: string, excludedId: string) => void
  ): Promise<void> {
    try {
      // Parse JSON từ client thành object
      const data: WebSocketMessage = JSON.parse(message);

      // Nếu không có type, trả về lỗi
      if (!data.type) {
        socket.send(JSON.stringify({ error: "Missing message type" }));
        return;
      }

      // Xử lý từng loại message dựa vào `type`
      switch (data.type) {
        case "SEND_MESSAGE": {
          // Nếu thiếu nội dung thì trả về lỗi
          if (!data.content) {
            socket.send(JSON.stringify({ error: "Missing message content" }));
            return;
          }

          console.log(data, "datadatadata");

          // Tạo DTO để lưu tin nhắn vào DB
          const messageDto: CreateMessageDto = {
            conversationId,
            content: data.content,
            senderType: isAdmin ? "ADMIN" : "CLIENT",
            userId: isAdmin ? userId ?? undefined : undefined, // Admin thì dùng userId
            guestId: !isAdmin ? userId ?? crypto.randomUUID() : undefined, // Client thì dùng guestId
            mediaIds: data.mediaIds,
          };

          // Gọi service lưu tin nhắn vào DB
          const message = await createMessage(env, messageDto);

          // In the SEND_MESSAGE case, when returning the new message:
          const newMessage = await getMessageById(env, message.id);

          // 🔔 Gửi notification
          await createNewNotification(env, {
            title: "Tin nhắn mới",
            content: data.content,
            type: NotificationType.NEW_MESSAGE,
            userId: userId,
            conversationId,
          });

          const typingNotifi = JSON.stringify({
            type: "NOTIFICATION",
            name: "Tin nhắn mới",
          });
          broadcastExcept(typingNotifi, userId);

          broadcast(
            JSON.stringify({
              type: "NEW_MESSAGE",
              message: {
                id: newMessage.id,
                content: newMessage.content,
                senderType: newMessage.senderType,
                userId: userId || "anonymous",
                conversationId: conversationId,
                createdAt: newMessage.createdAt,
                media:
                  newMessage.messageOnMedia?.map((item) => ({
                    id: item.media?.id,
                    url: item.media?.url,
                  })) || [],
              },
            })
          );
          break;
        }
        case "TYPING": {
          try {
            const senderIdentifier = isAdmin
              ? `admin:${userId}`
              : `client:${userId}`;
            const user = userId ? await getUserById(env, userId) : null;
            const displayName = user ? user.name : "Guest";

            // Tạo message trước để tránh tạo lặp lại nhiều lần
            const typingMessage = JSON.stringify({
              type: "TYPING",
              name: displayName,
              isAdmin: isAdmin,
            });

            // Broadcast đến tất cả ngoại trừ người gửi
            broadcastExcept(typingMessage, senderIdentifier);
          } catch (err) {
            console.error("Error handling TYPING event:", err);
          }
          break;
        }
        case "REQUEST_HISTORY": {
          // Lấy lại lịch sử cuộc trò chuyện từ DB
          const page = data.page || 1;
          const limit = data.limit || 10;
          const conversation = await getAllMessage(
            env,
            conversationId,
            page,
            limit
          );

          if (conversation?.messages) {
            // Gửi danh sách tin nhắn về cho client
            socket.send(
              JSON.stringify({
                type: "HISTORY",
                messages: conversation.messages.map((m) => ({
                  id: m.id,
                  content: m.content,
                  senderType: m.senderType,
                  createdAt: m.createdAt,
                  url: m?.media?.map((item) => item.url),
                })),
              })
            );
          } else {
            // Nếu không có cuộc trò chuyện, trả về lỗi
            socket.send(JSON.stringify({ error: "Conversation not found" }));
          }
          break;
        }

        default: {
          // Nếu type không hợp lệ
          socket.send(JSON.stringify({ error: "Unknown message type" }));
          break;
        }
      }
    } catch (err) {
      console.error("Error handling WebSocket message:", err);
      // Trả về lỗi chung nếu có lỗi không xác định
      socket.send(JSON.stringify({ error: "Internal server error" }));
    }
  }

  // Hàm khởi tạo kết nối WebSocket khi client mới join vào phòng chat
  async initializeWebSocketConnection(
    socket: WebSocket,
    env: Env,
    conversationId: string
  ): Promise<void> {
    try {
      // Lấy lịch sử cuộc trò chuyện
      const messagesExisting = await getAllMessage(env, conversationId);

      if (messagesExisting?.messages) {
        // Gửi toàn bộ lịch sử tin nhắn cho client mới kết nối
        socket.send(
          JSON.stringify({
            type: "HISTORY",
            messages: messagesExisting?.messages.map((m) => ({
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
      }
    } catch (err) {
      console.error("Error sending history:", err);
      socket.send(JSON.stringify({ error: "Failed to load history" }));
    }
  }
}
