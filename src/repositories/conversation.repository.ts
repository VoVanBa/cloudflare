import { Conversation } from "./../models/conversation";
import { getPrismaClient } from "../untils/db";
import {
  CreateConversationRequestDto,
  UpdateConversationRequestDto,
} from "../dtos/request/conversation.dto";

export async function create(
  env: Env,
  data: CreateConversationRequestDto
): Promise<Conversation> {
  const prisma = getPrismaClient(env);

  const conversation = await prisma.conversation.create({
    data: {
      ...data,
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
  return new Conversation(conversation);
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
  return new Conversation(conversation);
}

export async function findAllConversations(
  env: Env,
  businessId: string,
  page: number = 1,
  limit: number = 10
): Promise<Conversation[]> {
  const prisma = getPrismaClient(env);

  const conversations = await prisma.conversation.findMany({
    where: {
      businessId,
    },
    orderBy: {
      createdAt: "desc",
    },
    skip: (page - 1) * limit,
    take: limit,
  });

  return conversations.map((conversation) => new Conversation(conversation));
}

// export async function updateConversation(
//   env: Env,
//   id: string,
//   data: UpdateConversationRequestDto
// ): Promise<Conversation> {
//   const prisma = getPrismaClient(env);

//   const conversation = await prisma.conversation.update({
//     where: { id },
//     data: {
//       ...data,

//     },
//   });
//   return new Conversation(conversation);
// }

export async function deleteConversation(env: Env, id: string): Promise<void> {
  const prisma = getPrismaClient(env);

  await prisma.conversation.delete({
    where: { id },
  });
}

export async function getConversationId(
  env: Env,
  conversationId: string
): Promise<Conversation | null> {
  const prisma = getPrismaClient(env);
  const conversation = await prisma.conversation.findFirst({
    where: {
      id: conversationId,
    },
    include: {
      messages: true,
    },
  });
  return conversation ? new Conversation(conversation) : null;
}

export async function updateCreateAt(
  env: Env,
  consersationId: string
): Promise<void> {
  const prisma = getPrismaClient(env);
  await prisma.conversation.update({
    where: {
      id: consersationId,
    },
    data: {
      createdAt: new Date(),
    },
  });
}
