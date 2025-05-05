import {
  CreateMessageDto,
  UpdateMessageDto,
} from "../dtos/request/message.dto";
import { Message } from "../models/message";
import { getPrismaClient } from "../untils/db";

export async function getMessages(
  env: Env,
  conversationId: string,
  page: number = 1,
  limit: number = 10
): Promise<Message[]> {
  const prisma = getPrismaClient(env);
  const skip = (page - 1) * limit;
  const message = await prisma.message.findMany({
    where: {
      conversationId: conversationId,
      deletedAt: null,
    },
    include: {
      user: true,
      conversation: true,
      messageOnMedia: {
        include: {
          media: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    skip: skip,
    take: limit,
  });
  return message.map((message) => {
    return new Message(message);
  });
}

export async function getMessage(
  env: Env,
  messageId: string
): Promise<Message | null> {
  const prisma = getPrismaClient(env);
  const message = await prisma.message.findFirst({
    where: {
      id: messageId,
    },
    include: {
      user: true,
      conversation: true,
      messageOnMedia: {
        include: {
          media: true,
        },
      },
    },
  });
  return message ? new Message(message) : null;
}

export async function create(
  env: Env,
  messageData: CreateMessageDto
): Promise<Message> {
  const prisma = getPrismaClient(env);

  const message = await prisma.message.create({
    data: {
      conversationId: messageData.conversationId,
      userId: messageData.userId,
      content: messageData.content,
      senderType: messageData.senderType,
      chatTypes: messageData.chatType,
      messageOnMedia: messageData.mediaIds
        ? {
            create: messageData.mediaIds.map((mediaId) => ({
              mediaId: mediaId,
            })),
          }
        : undefined,
    },
    include: {
      user: true,
      conversation: true,
      messageOnMedia: {
        include: {
          media: true,
        },
      },
    },
  });

  return new Message(message);
}

export async function updateMessage(
  env: Env,
  messageId: string,
  messageData: UpdateMessageDto
): Promise<Message | null> {
  const prisma = getPrismaClient(env);
  const message = await prisma.message.update({
    where: {
      id: messageId,
      deletedAt: null,
    },
    data: {
      ...messageData,
      updatedAt: new Date(),
    },
  });
  return message ? new Message({ message }) : null;
}

export async function getMessageCount(
  env: Env,
  conversationId: string
): Promise<number> {
  const prisma = getPrismaClient(env);
  return await prisma.message.count({
    where: {
      conversationId: conversationId,
      deletedAt: null,
    },
  });
}

export async function countUnreadMessages(
  env: Env,
  conversationId: string,
  userId: string,
  lastReadAt: Date
): Promise<number> {
  const prisma = getPrismaClient(env);
  return await prisma.message.count({
    where: {
      conversationId,
      createdAt: {
        gt: lastReadAt, // Tin nhắn có createdAt lớn hơn lastReadAt
      },
      userId: {
        not: userId, // Không đếm tin nhắn do chính user gửi
      },
    },
  });
}
