import { ConversationStatus } from "../../models/enums";

export class CreateConversationRequestDto {
  userId: string;
  businessId: string;
}

export class UpdateConversationStatusRequestDto {
  conversationId: string;
  status: ConversationStatus;
}

export class AssignAdminToConversationRequestDto {
  conversationId: string;
  adminId: string;
}

export class UnassignAdminFromConversationRequestDto {
  conversationId: string;
}

export class GetConversationMessagesRequestDto {
  conversationId: string;
  page?: number;
  limit?: number;
}

export class GetConversationsRequestDto {
  businessId: string;
  page?: number;
  limit?: number;
  status?: ConversationStatus;
}

export class LinkUserToConversationRequestDto {
  conversationId: string;
  userId: string;
}

export class DeleteConversationRequestDto {
  conversationId: string;
}
