import { AssignmentStatus } from "./enums";

export class AdminAssignment {
  id: string;
  conversationId: string;
  adminId: string;
  assignedAt: Date;
  status: AssignmentStatus;

  constructor(data: any) {
    this.id = data.id;
    this.conversationId = data.conversationId;
    this.adminId = data.adminId;
    this.assignedAt = data.assignedAt;
    this.status = data.status;
  }
} 