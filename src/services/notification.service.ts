import { NotificationDto } from "../dtos/request/notification.dto";
import { NotificationType } from "../models/enums";
import {
  createNotification,
  getNotificationsByUserId,
  markNotificationAsRead,
  deleteNotification,
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
  page: number = 1,
  limit: number = 10
) => {
  return getNotificationsByUserId(env, userId, page, limit);
};

export const markAsRead = async (env: Env, notificationId: string) => {
  
  return markNotificationAsRead(env, notificationId);
};

export const removeNotification = async (env: Env, notificationId: string) => {
  return deleteNotification(env, notificationId);
};
