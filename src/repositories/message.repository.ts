import {
  CreateMessageDto,
  UpdateMessageDto,
} from "../dtos/request/message.dto";
import { Message } from "../models/message";
import { getPrismaClient } from "../untils/db";

export async function getMessages(
  env: Env,
  conversationId: string
): Promise<Message[]> {
  const prisma = getPrismaClient(env);
  const message = await prisma.message.findMany({
    where: {
      conversationId: conversationId,
      deletedAt: null,
    },
    include: {
      user: true,
      conversation: true,
    },
    orderBy: { createdAt: "asc" },
  });
  return message.map((message) => {
    return new Message({ message });
  });
}

export async function getMessage(
  env: Env,
  messageId: string
): Promise<Message | null> {
  const prisma = getPrismaClient(env);
  const message = await prisma.message.findUnique({
    where: {
      id: messageId,
      deletedAt: null,
    },
    include: {
      user: true,
      conversation: true,
    },
  });
  return message ? new Message({ message }) : null;
}

export async function createMessage(
  env: Env,
  messageData: CreateMessageDto
): Promise<Message> {
  const prisma = getPrismaClient(env);
  const message = await prisma.message.create({
    data: {
      ...messageData,
      createdAt: new Date(),
    },
    include: {
      user: true,
      conversation: true,
    },
  });
  return new Message({ message });
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
