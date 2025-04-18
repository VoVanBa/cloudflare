import { Conversation } from './../models/conversation';
import {
  CreateMessageDto,
  UpdateMessageDto,
} from "../dtos/request/message.dto";
import { updateCreateAt } from "../repositories/conversation.repository";
import {
  create,
  getMessageCount,
  getMessages,
} from "../repositories/message.repository";

export const getAllMessage = async (
  env: Env,
  conversationId: string,
  page: number = 1,
  limit: number = 10
): Promise<any> => {
  // Lấy dữ liệu tin nhắn từ hàm getMessages
  const messages = await getMessages(env, conversationId, page, limit);

  // Chỉ lấy các trường cần thiết: id, conversationId, content, senderType
  const simplifiedMessages = messages.map((message: any) => ({
    id: message.id,
    conversationId: message.conversationId,
    content: message.content,
    senderType: message.senderType,
  }));

  // Giả sử bạn có hàm `getMessageCount` để lấy tổng số tin nhắn
  const totalMessages = await getMessageCount(env, conversationId);

  // Tính toán tổng số trang
  const totalPages = Math.ceil(totalMessages / limit);

  // Trả về dữ liệu tin nhắn đã được tối giản cùng với thông tin phân trang
  return {
    messages: simplifiedMessages,
    pagination: {
      page,
      limit,
      totalMessages,
      totalPages,
    },
  };
};

// Giả sử bạn có hàm getMessageCount để lấy tổng số tin nhắn

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

  console.log("message", message);
  await updateCreateAt(env, message.conversationId);
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
