import { Conversation, Prisma } from "@prisma/client";
import { getPrismaClient } from "../untils/db";

export class ConversationRepository {
//   async createConversation(env: Env): Promise<Conversation> {
//     const prisma = getPrismaClient(env);
//     return await prisma.conversation.create({ data });
//   }

  async findConversationById(
    env: Env,
    id: string
  ): Promise<Conversation | null> {
    const prisma = getPrismaClient(env);

    return prisma.conversation.findUnique({ where: { id } });
  }

  async findAllConversations(env: Env): Promise<Conversation[]> {
    const prisma = getPrismaClient(env);

    return await prisma.conversation.findMany();
  }

  async updateConversation(
    id: string,
    env: Env,
    data: Prisma.ConversationUpdateInput
  ): Promise<Conversation> {
    const prisma = getPrismaClient(env);

    return await prisma.conversation.update({
      where: { id },
      data,
    });
  }

  async deleteConversation(env: Env, id: string): Promise<Conversation> {
    const prisma = getPrismaClient(env);

    return await prisma.conversation.delete({ where: { id } });
  }
}
