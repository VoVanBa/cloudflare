import {
  CreateMessageDto,
  UpdateMessageDto,
} from "../dtos/request/message.dto";
import { getMessages } from "../repositories/message.repository";

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
  const message = await createMessage(env, messageData);
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
