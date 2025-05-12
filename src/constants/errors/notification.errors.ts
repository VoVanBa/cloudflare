export const NOTIFICATION_ERRORS = {
  FETCH_FAILED: "Failed to fetch notifications",
  MARK_AS_READ_FAILED: "Failed to mark notification as read",
  DELETE_FAILED: "Failed to delete notification",
  NOTIFICATION_NOT_FOUND: "Notification not found",
} as const;

export type NotificationErrorType = keyof typeof NOTIFICATION_ERRORS;
