import { name } from "drizzle-orm";
import { CreateConversationRequestDto } from "../dtos/request/conversation.dto";
import {
  create,
  deleteConversation,
  findAllConversations,
  findConversationById,
  getConversationClientId,
  linkConversationWithUser,
  updateCreateAt,
} from "../repositories/conversation.repository";
import { MessageResponseDto } from "../dtos/response/auth/message.dto";

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
  const conversations = await findAllConversations(
    env,
    businessId,
    page,
    limit
  );

  const conversationsWithMessages = conversations.filter(
    (conversation) => conversation.messages && conversation.messages.length > 0
  );

  return {
    data: conversationsWithMessages.map((conversation) => ({
      id: conversation.id,
      name: conversation.user?.name,
    })),
    page,
    limit,
    total: conversationsWithMessages.length,
  };
};

export const createConversation = async (
  env: Env,
  data: CreateConversationRequestDto
): Promise<any> => {
  const existClient = await getConversationClientId(env, data.userId);
  console.log(existClient, "sssss");

  if (!existClient) {
    const conversation = await create(env, data);

    return {
      id: conversation.id,
      userId: conversation.userId, 
    };
  } else {
    return {
      id: existClient.id,
      userId: existClient.userId, 
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

export const updateUserConversation = async (
  env: Env,
  conversationId: string,
  userId: string
) => {
  const conversation = await findConversationById(env, conversationId);
  if (!conversation) {
    throw new Error("Conversation not found");
  }
  const update = await linkConversationWithUser(env, conversationId, userId);
};

export const deleteConversationbyId = async (
  env: Env,
  conversationId: string
): Promise<any> => {
  await deleteConversation(env, conversationId);
};
export const getMessageByConversationId = async (
  env: Env,
  messageId: string
): Promise<any> => {
  const message = await findConversationById(env, messageId);
  return message;
};
