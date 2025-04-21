import { MessageOnMedia } from "../models/messageOnMeida";
import { createMany } from "../repositories/messageOnMedia";

export const createMessageOnMediaMany = async (
  env: Env,
  messageId: string,
  mediaIds: string[]
): Promise<MessageOnMedia[]> => {
  if (mediaIds.length === 0) return [];

  // Gọi repository tạo liên kết
  const messageOnMediaList = await createMany(env, messageId, mediaIds);
  return messageOnMediaList;
};
