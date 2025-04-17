import { name } from "drizzle-orm";
import { CreateConversationRequestDto } from "../dtos/request/conversation.dto";
import {
  create,
  findAllConversations,
  findConversationById,
  getConversationId,
  updateCreateaAt,
  updateCreateAt,
} from "../repositories/conversation.repository";
import { MessageResponseDto } from "../dtos/response/auth/message.dto";

export const getConversationById = async (env: Env, conversationId: string) => {
  const conversation = await findConversationById(env, conversationId);
  console.log("conversation", conversation);
  return conversation;
};

export const getConversation = async (
  env: Env,
  conversationId: string
): Promise<MessageResponseDto[]> => {
  const conversation = await getConversationId(env, conversationId);
  if (!conversation) {
    throw new Error("Conversation not found");
  }

  const messages = conversation.messages.map((msg: any) => ({
    id: msg.id,
    content: msg.content,
    senderType: msg.senderType,
  }));

  return messages;
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
  const conversation = await create(env, data);
  return conversation;
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
