import { createMessage } from "../../services/message.service";
import { getConversationById } from "../../services/conversation.service";

import { CreateMessageDto } from "../../dtos/request/message.dto";

// Interface định nghĩa cấu trúc message nhận được từ WebSocket
interface WebSocketMessage {
  type: string; // Loại message: SEND_MESSAGE, TYPING, REQUEST_HISTORY,...
  content?: string; // Nội dung (chỉ áp dụng khi type là SEND_MESSAGE)
  [key: string]: any; // Cho phép các thuộc tính linh hoạt khác
}

// Hàm xử lý khi một tin nhắn được gửi tới WebSocket
export async function handleWebSocketMessage(
  socket: WebSocket, // Socket hiện tại
  message: string, // Chuỗi message dạng JSON từ client gửi lên
  env: Env, // Biến môi trường chứa config, DB,...
  conversationId: string, // ID cuộc trò chuyện hiện tại
  userId: string | null, // ID của user (client hoặc admin)
  isAdmin: boolean, // Đánh dấu user là admin hay không
  broadcast: (message: string) => void // Hàm để broadcast message tới các client khác
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

        // Tạo DTO để lưu tin nhắn vào DB
        const messageDto: CreateMessageDto = {
          conversationId,
          content: data.content,
          senderType: isAdmin ? "ADMIN" : "CLIENT",
          userId: isAdmin ? userId ?? undefined : undefined, // Admin thì dùng userId
          guestId: !isAdmin ? userId ?? crypto.randomUUID() : undefined, // Client thì dùng guestId
        };

        // Gọi service lưu tin nhắn vào DB
        const newMessage = await createMessage(env, messageDto);

        // Broadcast tin nhắn mới cho tất cả client trong phòng
        broadcast(
          JSON.stringify({
            type: "NEW_MESSAGE",
            message: {
              id: newMessage.id,
              content: newMessage.content,
              senderType: newMessage.senderType,
              createdAt: newMessage.createdAt,
            },
          })
        );
        break;
      }

      case "TYPING": {
        // Gửi trạng thái "đang nhập" tới các client khác
        broadcast(
          JSON.stringify({
            type: "TYPING",
            userId: userId ?? "anonymous",
            conversationId,
          })
        );
        break;
      }

      case "REQUEST_HISTORY": {
        // Lấy lại lịch sử cuộc trò chuyện từ DB
        const conversation = await getConversationById(env, conversationId);

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
export async function initializeWebSocketConnection(
  socket: WebSocket,
  env: Env,
  conversationId: string
): Promise<void> {
  try {
    // Lấy lịch sử cuộc trò chuyện
    const conversation = await getConversationById(env, conversationId);

    if (conversation?.messages) {
      // Gửi toàn bộ lịch sử tin nhắn cho client mới kết nối
      socket.send(
        JSON.stringify({
          type: "HISTORY",
          messages: conversation.messages.map((m) => ({
            id: m.id,
            content: m.content,
            senderType: m.senderType,
            createdAt: m.createdAt,
          })),
        })
      );
    }
  } catch (err) {
    console.error("Error sending history:", err);
    socket.send(JSON.stringify({ error: "Failed to load history" }));
  }
}
