import { AssignmentStatus, ConversationStatus } from "../models/enums";
import { AdminAssignment } from "../models/admin-assignment";
import { getPrismaClient } from "../untils/db";
import {
  create,
  findActiveByConversationId,
  findByAdminId,
  findByConversationId,
  findInDateRange,
  update,
} from "../repositories/admin-assignment.repository";

export const assignAdminToConversation = async (
  env: Env,
  conversationId: string,
  adminId: string
): Promise<AdminAssignment> => {
  const currentAssignment = await findActiveByConversationId(
    env,
    conversationId
  );

  if (currentAssignment) {
    throw new Error("Conversation already has an active assignment");
  }

  const newAssignment = await create(env, {
    conversationId,
    adminId,
  });

  return newAssignment;
};

export const getAdminAssignments = async (
  env: Env,
  adminId: string,
  status?: AssignmentStatus
): Promise<AdminAssignment[]> => {
  return findByAdminId(env, adminId, status);
};

export const getAssignmentHistory = async (
  env: Env,
  conversationId: string
): Promise<AdminAssignment[]> => {
  return findByConversationId(env, conversationId);
};

export const getAdminPerformance = async (
  env: Env,
  adminId: string,
  startDate: Date,
  endDate: Date
) => {
  const assignments = await findInDateRange(env, adminId, startDate, endDate);

  // Tính toán các chỉ số hiệu suất
  const stats = {
    totalAssignments: assignments.length,
    completedAssignments: assignments.filter(
      (a) => a.status === AssignmentStatus.COMPLETED
    ).length,
    transferredAssignments: assignments.filter(
      (a) => a.status === AssignmentStatus.TRANSFERRED
    ).length,
    averageResponseTime: 0, // Cần thêm logic tính thời gian phản hồi trung bình
    activeAssignments: assignments.filter(
      (a) => a.status === AssignmentStatus.ACTIVE
    ).length,
  };

  return stats;
};
