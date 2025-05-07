import { getUserById } from "../repositories/user.repository";
import { getAllMessage } from "./message.service";

// Cache thông tin user từ KV
export const getCachedUserName = async (
  env: Env,
  userId: string
): Promise<string> => {
  const cacheKey = `user:${userId}`;
  const cached = await env.KV.get(cacheKey, { type: "json" });
  console.log(cached, "cached");
  if (cached) {
    return cached.name;
  }
  const user = await getUserById(env, userId);
  if (user) {
    await env.KV.put(cacheKey, JSON.stringify({ name: user.name }), {
      expirationTtl: 86400, // Cache 24 giờ
    });
    return user.name;
  }
};

// Cache lịch sử tin nhắn từ KV
export const getCachedMessages = async (
  env: Env,
  conversationId: string,
  page: number,
  limit: number
): Promise<any> => {
  const cacheKey = `messages:${conversationId}:${page}:${limit}`;
  const cached = await env.KV.get(cacheKey, { type: "json" });
  if (cached) {
    return cached;
  }
  const messages = await getAllMessage(env, conversationId, page, limit);
  await env.KV.put(cacheKey, JSON.stringify(messages), {
    expirationTtl: 300, // Cache 5 phút
  });
  return messages;
};
