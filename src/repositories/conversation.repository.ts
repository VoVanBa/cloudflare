import { Conversation } from "./../models/conversation";
import { getPrismaClient } from "../untils/db";
import { CreateConversationRequestDto } from "../dtos/request/conversation.dto";
import { ConversationStatus } from "../models/enums";
import { UpdateConversationRequestDto } from "../dtos/request/admin-assignment.dto";

export async function create(
  env: Env,
  data: CreateConversationRequestDto
): Promise<Conversation> {
  const prisma = getPrismaClient(env);

  console.log(data, "data");
  const conversation = await prisma.conversation.create({
    data: {
      userId: data.userId,
      businessId: data.businessId,
    },
    include: {
      messages: true,
    },
  });
  return new Conversation(conversation);
}

export async function findConversationById(
  env: Env,
  id: string
): Promise<Conversation | null> {
  const prisma = getPrismaClient(env);

  const conversation = await prisma.conversation.findUnique({
    where: { id },
    include: { messages: true },
  });
  return conversation ? new Conversation(conversation) : null;
}

export async function findConversationByBusinessId(
  env: Env,
  id: string
): Promise<Conversation | null> {
  const prisma = getPrismaClient(env);

  const conversation = await prisma.conversation.findUnique({
    where: { id },
    include: { messages: true },
  });
  return conversation ? new Conversation(conversation) : null;
}

export async function findAllConversations(
  env: Env,
  businessId: string,
  userId: string,
  page: number = 1,
  limit: number = 10
): Promise<Conversation[]> {
  const prisma = getPrismaClient(env);

  const conversations = await prisma.conversation.findMany({
    where: {
      businessId,
      AND: [
        {
          assignments: {
            some: {
              adminId: userId,
            },
          },
        },
      ],
    },
    include: {
      messages: true,
      user: true,
      notification: true,
      assignments: {
        include: {
          admin: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    skip: (page - 1) * limit,
    take: limit,
  });

  return conversations.map((conversation) => new Conversation(conversation));
}

export async function linkConversationWithUser(
  env: Env,
  conversationId: string,
  userId: string
) {
  const prisma = getPrismaClient(env);
  return prisma.conversation.update({
    where: { id: conversationId },
    data: {
      userId,
    },
  });
}

export async function deleteConversation(env: Env, id: string): Promise<void> {
  const prisma = getPrismaClient(env);

  await prisma.conversation.update({
    where: { id },
    data: {
      deletedAt: new Date(),
    },
  });
}

export async function getConversationClientId(
  env: Env,
  userId?: string
): Promise<Conversation | null> {
  const prisma = getPrismaClient(env);

  const filter: any = {};
  if (userId) {
    filter.userId = userId;
  }

  const conversation = await prisma.conversation.findFirst({
    where: filter,
    include: {
      messages: true,
    },
  });

  return conversation ? new Conversation(conversation) : null;
}

export async function updateCreateAt(
  env: Env,
  conversationId: string
): Promise<void> {
  const prisma = getPrismaClient(env);
  await prisma.conversation.update({
    where: {
      id: conversationId,
    },
    data: {
      createdAt: new Date(),
    },
  });
}
