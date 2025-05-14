export const RATE_LIMIT = {
  WINDOW: 60 * 1000, // 1 minute in milliseconds
  MAX_MESSAGES_PER_WINDOW: 20, // Maximum messages allowed per window
} as const;
