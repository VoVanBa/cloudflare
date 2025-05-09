import { getPrismaClient } from "../untils/db";
import { AssignmentStatus } from "../models/enums";
import { AdminAssignment } from "../models/admin-assignment";

export async function findActiveByConversationId(
  env: Env,
  conversationId: string
): Promise<AdminAssignment | null> {
  const prisma = getPrismaClient(env);
  const assignment = await prisma.adminAssignment.findFirst({
    where: {
      conversationId,
      status: AssignmentStatus.ACTIVE,
    },
  });
  return assignment ? new AdminAssignment(assignment) : null;
}

export async function create(
  env: Env,
  data: {
    conversationId: string;
    adminId: string;
    reason?: string;
    notes?: string;
  }
): Promise<AdminAssignment> {
  const prisma = getPrismaClient(env);
  const assignment = await prisma.adminAssignment.create({
    data: {
      ...data,
      status: AssignmentStatus.ACTIVE,
      assignedAt: new Date(),
    },
  });
  return new AdminAssignment(assignment);
}

export async function update(
  env: Env,
  id: string,
  data: {
    status?: AssignmentStatus;
    unassignedAt?: Date;
    reason?: string;
    notes?: string;
  }
): Promise<AdminAssignment> {
  const prisma = getPrismaClient(env);
  const assignment = await prisma.adminAssignment.update({
    where: { id },
    data,
  });
  return new AdminAssignment(assignment);
}

export async function findByAdminId(
  env: Env,
  adminId: string,
  status?: AssignmentStatus
): Promise<AdminAssignment[]> {
  const prisma = getPrismaClient(env);
  const assignments = await prisma.adminAssignment.findMany({
    where: {
      adminId,
      ...(status && { status }),
    },
    include: {
      conversation: {
        include: {
          messages: {
            orderBy: { createdAt: "desc" },
            take: 1,
          },
          user: true,
        },
      },
    },
    orderBy: {
      assignedAt: "desc",
    },
  });
  return assignments.map((assignment) => new AdminAssignment(assignment));
}

export async function findByConversationId(
  env: Env,
  conversationId: string
): Promise<AdminAssignment[]> {
  const prisma = getPrismaClient(env);
  const assignments = await prisma.adminAssignment.findMany({
    where: {
      conversationId,
    },
    include: {
      admin: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: {
      assignedAt: "desc",
    },
  });
  return assignments.map((assignment) => new AdminAssignment(assignment));
}

export async function findInDateRange(
  env: Env,
  adminId: string,
  startDate: Date,
  endDate: Date
): Promise<AdminAssignment[]> {
  const prisma = getPrismaClient(env);
  const assignments = await prisma.adminAssignment.findMany({
    where: {
      adminId,
      assignedAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    include: {
      conversation: true,
    },
  });
  return assignments.map((assignment) => new AdminAssignment(assignment));
}
