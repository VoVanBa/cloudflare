import { CreateConversationRequestDto } from "../dtos/request/conversation.dto";
import {
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

export const getAllConversations = async (env: Env): Promise<any> => {
  const conversations = await findAllConversations(env);
  return conversations;
};

export const createConversation = async (
  env: Env,
  data: CreateConversationRequestDto
): Promise<any> => {
  const conversation = await createConversation(env, data);
  return conversation;
};
