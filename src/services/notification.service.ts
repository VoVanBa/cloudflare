import { NotificationDto } from "../dtos/request/notification.dto";
import { NotificationType } from "../models/enums";
import { findConversationById } from "../repositories/conversation.repository";
import {
  createNotification,
  getNotificationsByUserId,
  markNotificationAsRead,
  deleteNotification,
  getNotificationByConversation,
} from "../repositories/notification.repository";

export const createNewNotification = async (
  env: Env,
  data: NotificationDto
) => {
  return createNotification(env, data);
};

export const fetchNotifications = async (
  env: Env,
  userId: string,
) => {
  return getNotificationsByUserId(env, userId);
};

export const markAsRead = async (env: Env, notificationId: string) => {

  const notificationIds = await fetchNotificationsByConversationId(env, notificationId);

  return markNotificationAsRead(env, notificationIds.map(notification => notification.id));
};

export const removeNotification = async (env: Env, notificationId: string) => {
  return deleteNotification(env, notificationId);
};

export const fetchNotificationsByConversationId = async (
  env: Env,
  conversationId: string
) => {
  return getNotificationByConversation(env, conversationId);
};

// export const markAsReadByConversationId = async (env: Env, conversationId: string) => {
//   const notificationIds = await fetchNotificationsByConversationId(env, conversationId);
//   return markNotificationAsRead(env, notificationIds);
// };
