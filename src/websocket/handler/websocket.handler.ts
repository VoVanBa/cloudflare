import {
  createMessage,
  getAllMessage,
  getMessageById,
} from "../../services/message.service";
import { CreateMessageDto } from "../../dtos/request/message.dto";
import { getUserById } from "../../repositories/user.repository";


interface WebSocketMessage {
  type: string; // Loại message: SEND_MESSAGE, TYPING, REQUEST_HISTORY,...
  content?: string;
  page?: number;
  limit?: number;
  mediaIds?: string[];
  [key: string]: any;
}

export class WebSocketHandler {
  async handleWebSocketMessage(
    socket: WebSocket,
    message: string,
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
          if (!data.content && (!data.mediaIds || data.mediaIds.length === 0)) {
            socket.send(
              JSON.stringify({ error: "Missing message content or media" })
            );
            return;
          }

          console.log(data, "datadatadata");

          // Tạo DTO để lưu tin nhắn vào DB
          const messageDto: CreateMessageDto = {
            conversationId,
            content: data.content || "",
            senderType: isAdmin ? "ADMIN" : "CLIENT",
            userId: userId,
            mediaIds: data.mediaIds,
            chatType: "",
          };

          // Gọi service lưu tin nhắn vào DB
          const message = await createMessage(env, messageDto);

          const senderName = message.user.name;

          // // Tăng unreadCount trong KV
          // const unreadKey = `unread:${conversationId}:${recipientId}`;
          // let unreadCount = 0;
          // const existingUnread = await env.KV.get(unreadKey, { type: "json" });
          // if (existingUnread) {
          //   unreadCount = existingUnread.count;
          // }
          // unreadCount += 1;
          // await env.KV.put(
          //   unreadKey,
          //   JSON.stringify({ count: unreadCount }),
          //   { expirationTtl: 86400 } // TTL: 24 giờ
          // );

          // // Tạo thông báo và lưu vào KV
          // if (userId) {
          //   const user = await getUserById(env, userId);
          // }
          // const notificationId = crypto.randomUUID();
          // const notification = {
          //   title: `Tin nhắn mới từ ${senderName}`,
          //   content: data.content || "Đã gửi một hình ảnh",
          //   type: NotificationType.NEW_MESSAGE,
          //   conversationId,
          //   userId: recipientId,
          //   timestamp: new Date().toISOString(),
          //   isRead: false,
          // };
          // await env.KV.put(
          //   `notification:${notificationId}`,
          //   JSON.stringify(notification),
          //   { expirationTtl: 86400 }
          // );

          // if (userId !== null) {
          //   broadcastExcept(typingNotifi, userId);
          // }

          broadcast(
            JSON.stringify({
              type: "NEW_MESSAGE",
              message: {
                id: message.id,
                content: message.content,
                senderType: message.senderType,
                userId: userId,
                conversationId: conversationId,
                createdAt: message.createdAt,
                media:
                  message.messageOnMedia?.map((item) => ({
                    id: item.media?.id,
                    url: item.media?.url,
                  })) || [],
              },
            })
          );

          console.log(isAdmin, message, "message", "message.messageOnMedia");

          if (!isAdmin && message) {
            const senderIdentifier = isAdmin
              ? `admin:${userId}`
              : `client:${userId}`;
            const notificationMessage = JSON.stringify({
              type: "NEW_CLIENT_MESSAGE",
              conversationId: conversationId,
              guestName: senderName,
              message: message.content || "Sent an image",
              timestamp: message.createdAt || new Date().toISOString(),
            });
            broadcastExcept(notificationMessage, senderIdentifier || "");
          }
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
                  media:
                    m.media?.map((item) => ({
                      id: item?.id,
                      url: item?.url,
                    })) || [],
                })),
              })
            );
          } else {
            // Nếu không có cuộc trò chuyện, trả về lỗi
            socket.send(JSON.stringify({ error: "Conversation not found" }));
          }
          break;
        }

        case "MARK_AS_READ": {
          // New case to mark messages as read
          if (!conversationId) {
            socket.send(JSON.stringify({ error: "Missing conversation ID" }));
            return;
          }

          // Here you would typically update a database to mark messages as read
          // For now, just broadcast that messages have been read
          broadcast(
            JSON.stringify({
              type: "MESSAGES_READ",
              conversationId: conversationId,
              readBy: userId,
              timestamp: new Date().toISOString(),
            })
          );
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
