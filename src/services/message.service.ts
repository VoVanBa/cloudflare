import { Conversation } from "./../models/conversation";
import {
  CreateMessageDto,
  UpdateMessageDto,
} from "../dtos/request/message.dto";
import { updateCreateAt } from "../repositories/conversation.repository";
import {
  create,
  getMessage,
  getMessageCount,
  getMessages,
} from "../repositories/message.repository";
import { createMessageOnMediaMany } from "./messageOnMedia.service";

export const getAllMessage = async (
  env: Env,
  conversationId: string,
  page: number = 1,
  limit: number = 10
): Promise<any> => {
  // Lấy dữ liệu tin nhắn từ hàm getMessages
  const messages = await getMessages(env, conversationId, page, limit);

  console.log(messages, "ạhdashdsakhdjas");

  // Chỉ lấy các trường cần thiết: id, conversationId, content, senderType
  const simplifiedMessages = messages.map((message: any) => ({
    id: message.id,
    conversationId: message.conversationId,
    content: message.content,
    media: message.messageOnMedia.map((item) => ({
      id: item.media.id,
      url: item.media.url,
    })),
    senderType: message.senderType,
    createdAt: message.createdAt,
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
  const message = await getMessage(env, messageId);
  return message;
};

export const createMessage = async (
  env: Env,
  messageData: CreateMessageDto
): Promise<any> => {
  console.log(messageData, "ádasdsd");
  const message = await create(env, messageData);

  await updateCreateAt(env, message.conversationId);
  if ((messageData.mediaIds ?? []).length > 0) {
    await createMessageOnMediaMany(
      env,
      message.id,
      messageData?.mediaIds ?? []
    );
  }
  console.log("message", message);

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
