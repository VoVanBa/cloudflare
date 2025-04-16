import { name } from "drizzle-orm";
import { CreateConversationRequestDto } from "../dtos/request/conversation.dto";
import {
  create,
  findAllConversations,
  findConversationById,
} from "../repositories/conversation.repository";

export const getConversationById = async (env: Env, conversationId: string) => {
  const conversation = await findConversationById(env, conversationId);
  return conversation;
};

export const getConversationId = async (
  env: Env,
  userId: string,
  businessId: string
): Promise<any> => {
  const conversation = await getConversationId(env, userId, businessId);
  if (!conversation) {
    throw new Error("Conversation not found");
  }
  return conversation;
};

export const getAllConversations = async (
  env: Env,
  businessId: string
): Promise<any> => {
  const conversations = await findAllConversations(env, businessId);

  return {
    data: conversations.map((conversation) => ({
      id: conversation.id,
      name: conversation.userId
        ? conversation.user?.name
        : conversation.clientType,
    })),
  };
};

export const createConversation = async (
  env: Env,
  data: CreateConversationRequestDto
): Promise<any> => {
  const conversation = await create(env, data);
  return conversation;
};
