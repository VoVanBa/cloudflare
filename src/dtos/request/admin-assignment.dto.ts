import { AssignmentStatus } from "../../models/enums";

export class AssignAdminRequestDto {
  conversationId: string;
  adminId: string;
  reason?: string;
  notes?: string;
}

export class CompleteAssignmentRequestDto {
  assignmentId: string;
  notes?: string;
}

export class CancelAssignmentRequestDto {
  assignmentId: string;
  reason: string;
}

export class GetAdminAssignmentsRequestDto {
  adminId: string;
  status?: AssignmentStatus;
  page?: number;
  limit?: number;
}

export class GetAssignmentHistoryRequestDto {
  conversationId: string;
  page?: number;
  limit?: number;
}

export class GetAdminPerformanceRequestDto {
  adminId: string;
  startDate: Date;
  endDate: Date;
} 
export class UpdateConversationRequestDto {
  conversationId: string;
  adminId: string;
}