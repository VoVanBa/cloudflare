import { NotificationDto } from "../dtos/request/notification.dto";
import { NotificationType } from "../models/enums";
import { NOTIFICATION_ERRORS } from "../constants/errors";
import { findConversationById } from "../repositories/conversation.repository";
import {
  createNotification,
  getNotificationsByUserId,
  markNotificationAsRead,
  deleteNotification,
  getNotificationByConversation,
  getNotificationByBusiness,
} from "../repositories/notification.repository";

export const createNewNotification = async (
  env: Env,
  data: NotificationDto
) => {
  try {
    return await createNotification(env, data);
  } catch (error) {
    throw new Error(NOTIFICATION_ERRORS.FETCH_FAILED);
  }
};

export const fetchNotifications = async (env: Env, userId: string) => {
  try {
    return await getNotificationsByUserId(env, userId);
  } catch (error) {
    throw new Error(NOTIFICATION_ERRORS.FETCH_FAILED);
  }
};

export const markAsRead = async (env: Env, businessId: string) => {
  try {
    const notificationIds = await fetchNotificationsByBusinessId(
      env,
      businessId
    );
    return await markNotificationAsRead(
      env,
      notificationIds.map((notification) => notification.id)
    );
  } catch (error) {
    throw new Error(NOTIFICATION_ERRORS.MARK_AS_READ_FAILED);
  }
};

export const removeNotification = async (env: Env, notificationId: string) => {
  try {
    return await deleteNotification(env, notificationId);
  } catch (error) {
    throw new Error(NOTIFICATION_ERRORS.DELETE_FAILED);
  }
};

export const fetchNotificationsByBusinessId = async (
  env: Env,
  businessId: string,
  page: number = 1,
  limit: number = 10
) => {
  try {
    return await getNotificationByBusiness(env, businessId, page, limit);
  } catch (error) {
    throw new Error(NOTIFICATION_ERRORS.FETCH_FAILED);
  }
};

// export const markAsReadByConversationId = async (env: Env, conversationId: string) => {
//   const notificationIds = await fetchNotificationsByConversationId(env, conversationId);
//   return markNotificationAsRead(env, notificationIds);
// };
