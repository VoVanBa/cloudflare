export const WEBSOCKET_ERRORS = {
  INITIALIZATION_FAILED: "WebSocket initialization failed",
  UNAUTHORIZED: "Unauthorized WebSocket connection",
  MISSING_CONVERSATION_ID: "Missing conversationId in WebSocket URL",
  ACCEPT_FAILED: "WebSocket accept failed",
  MISSING_MESSAGE_TYPE: "Missing message type",
  UNKNOWN_MESSAGE_TYPE: "Unknown message type",
  MISSING_MESSAGE_CONTENT: "Missing message content or media",
  MISSING_CONVERSATION_ID_READ: "Missing conversation ID",
  MARK_AS_READ_FAILED: "Failed to mark messages as read",
  LOAD_HISTORY_FAILED: "Failed to load history",
  INTERNAL_SERVER_ERROR: "Internal server error",
} as const;

export type WebSocketErrorType = keyof typeof WEBSOCKET_ERRORS;
