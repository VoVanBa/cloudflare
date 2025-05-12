export const CONVERSATION_ERRORS = {
  CONVERSATION_NOT_FOUND: "Conversation not found",
  CONVERSATION_ALREADY_ASSIGNED:
    "Conversation already has an active assignment",
  FAILED_TO_MARK_AS_READ: "Failed to mark conversation as read",
} as const;

export type ConversationErrorType = keyof typeof CONVERSATION_ERRORS;
