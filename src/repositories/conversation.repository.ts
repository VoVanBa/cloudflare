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
    include: {
      messages: true,
      user: true,
    },
    orderBy: {
      createdAt: "desc",
    },
    skip: (page - 1) * limit,
    take: limit,
  });

  return conversations.map((conversation) => new Conversation(conversation));
}

// Gán userId vào conversation sau khi login thành công
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
      clientType: "AUTHENTICATED",
    },
  });
}

export async function deleteConversation(env: Env, id: string): Promise<void> {
  const prisma = getPrismaClient(env);

  await prisma.conversation.delete({
    where: { id },
  });
}

export async function getConversationClientId(
  env: Env,
  userId?: string,
  guestId?: string
): Promise<Conversation | null> {
  const prisma = getPrismaClient(env);

  // Tạo điều kiện tìm kiếm dựa trên userId hoặc guestId
  const filter: any = {};
  if (userId) {
    filter.userId = userId;
  }
  if (guestId) {
    filter.guestId = guestId;
  }

  // Tìm cuộc trò chuyện đầu tiên thỏa mãn điều kiện
  const conversation = await prisma.conversation.findFirst({
    where: filter,
    include: {
      messages: true,
    },
  });

  // Trả về đối tượng Conversation nếu tìm thấy, nếu không trả về null
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
