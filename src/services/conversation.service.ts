import { name } from "drizzle-orm";
import { CreateConversationRequestDto } from "../dtos/request/conversation.dto";
import {
  create,
  findAllConversations,
  findConversationById,
  getConversationClientId,
  updateCreateAt,
} from "../repositories/conversation.repository";
import { MessageResponseDto } from "../dtos/response/auth/message.dto";
import { ClientType } from "../models/enums";

export const getConversationById = async (env: Env, conversationId: string) => {
  const conversation = await findConversationById(env, conversationId);
  console.log("conversation", conversation);
  return conversation;
};

export const getConversationMessage = async (
  env: Env,
  conversationId: string,
  page: number = 1,
  limit: number = 10
): Promise<{ messages: MessageResponseDto[]; totalCount: number }> => {
  const conversation = await findConversationById(env, conversationId);
  if (!conversation) {
    throw new Error("Conversation not found");
  }

  const allMessages = conversation.messages;
  const totalCount = allMessages.length;

  // Tính offset
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;

  // Cắt mảng tin nhắn theo phân trang
  const paginatedMessages = allMessages
    .slice(startIndex, endIndex)
    .map((msg: any) => ({
      id: msg.id,
      content: msg.content,
      senderType: msg.senderType,
      createdAt: msg.createdAt,
    }));

  return {
    messages: paginatedMessages,
    totalCount,
  };
};

export const getAllConversations = async (
  env: Env,
  businessId: string,
  page: number = 1,
  limit: number = 10
): Promise<any> => {
  // Gọi đến hàm findAllConversations với các tham số phân trang
  const conversations = await findAllConversations(
    env,
    businessId,
    page,
    limit
  );

  return {
    data: conversations.map((conversation) => ({
      id: conversation.id,
      name: conversation.userId
        ? conversation.user?.name
        : conversation.clientType,
      clientType: conversation.clientType,
      userId: conversation.userId,
      guestId: conversation.guestId,
    })),
    // Bạn có thể thêm tổng số trang nếu cần, ví dụ như count từ DB
    page,
    limit,
    total: conversations.length, // Hoặc tổng số trang thực tế từ backend
  };
};

export const createConversation = async (
  env: Env,
  data: CreateConversationRequestDto
): Promise<any> => {
  // Kiểm tra xem đã có cuộc trò chuyện với userId hoặc guestId chưa
  const existClient = await getConversationClientId(
    env,
    data.userId,
    data.guestId
  );
  console.log(existClient, "sssss");

  // Nếu chưa có cuộc trò chuyện, tạo mới
  if (!existClient) {
    const conversation = await create(env, data);

    return {
      id: conversation.id,
      guestId: conversation.guestId, // gửi lại FE để lưu vào sessionStorage/localStorage (nếu là anonymous)
      userId: conversation.userId, // gửi lại FE để lưu vào localStorage (nếu là user)
    };
  } else {
    // Nếu cuộc trò chuyện đã tồn tại, có thể trả về thông tin cuộc trò chuyện hiện tại
    return {
      id: existClient.id,
      guestId: existClient.guestId, // nếu có guestId
      userId: existClient.userId, // nếu có userId
    };
  }
};

export const updateConversationCreateAt = async (
  env: Env,
  id: string
): Promise<any> => {
  const conversation = await findConversationById(env, id);
  if (!conversation) {
    throw new Error("Conversation not found");
  }
  updateCreateAt(env, id);
  return conversation;
};
