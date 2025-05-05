import { ConversationRead } from "../models/conversation-read";
import { getPrismaClient } from "../untils/db";

export async function updateConversationRead(
  env: Env,
  userId: string,
  conversationId: string
): Promise<ConversationRead> {
  const prisma = getPrismaClient(env);

  const conversationRead = await prisma.conversationRead.upsert({
    where: {
      userId_conversationId: {
        userId,
        conversationId,
      },
    },
    update: {
      lastReadAt: new Date(),
    },
    create: {
      userId,
      conversationId,
      lastReadAt: new Date(),
    },
  });

  return new ConversationRead(conversationRead);
}
export async function findConversationRead(
  env: Env,
  userId: string,
  conversationId: string
) {
  const prisma = getPrismaClient(env);
  return await prisma.conversationRead.findUnique({
    where: {
      userId_conversationId: {
        userId,
        conversationId,
      },
    },
  });
}
