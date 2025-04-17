import {
  CreateMessageDto,
  UpdateMessageDto,
} from "../dtos/request/message.dto";
import { updateCreateAt } from "../repositories/conversation.repository";
import { create, getMessages } from "../repositories/message.repository";

export const getAllMessage = async (
  env: Env,
  messageId: string
): Promise<any> => {
  const message = await getMessages(env, messageId);
  return message;
};

export const getMessageById = async (
  env: Env,
  messageId: string
): Promise<any> => {
  const message = await getMessages(env, messageId);
  return message;
};

export const createMessage = async (
  env: Env,
  messageData: CreateMessageDto
): Promise<any> => {
  const message = await create(env, messageData);
  updateCreateAt(env, message.conversationId);
  return message;
};
export const updateMessage = async (
  env: Env,
  messageId: string,
  messageData: UpdateMessageDto
): Promise<any> => {
  const message = await updateMessage(env, messageId, messageData);
  return message;
};
