// src/dto/create-message.dto.ts
export interface CreateMessageDto {
  conversationId: string; // ID của cuộc trò chuyện
  senderType: "CLIENT" | "ADMIN"; // Loại người gửi (CLIENT hoặc ADMIN)
  content: string; // Nội dung tin nhắn
  userId?: string; // Nếu ADMIN gửi thì có userId
  guestId?: string; // Nếu CLIENT gửi thì có guestId
  mediaIds?: string[];
  chatType: string;
}

// src/dto/update-message.dto.ts
export interface UpdateMessageDto {
  content?: string; // Cập nhật nội dung tin nhắn
  deletedAt?: Date; // Nếu tin nhắn bị xóa, thì lưu thời gian xóa
}
