import { getPrismaClient } from "../untils/db";
import { NotificationDto } from "../dtos/request/notification.dto";
import { Notification } from "../models/notification";

export async function createNotification(
  env: Env,
  data: NotificationDto
): Promise<Notification> {
  const prisma = getPrismaClient(env);
  const notifi = await prisma.notification.create({
    data: {
      userId: data.userId,
      title: data.title,
      content: data.content,
      type: data.type,
      isRead: false,
      conversationId: data.conversationId,
    },
  });
  return new Notification(notifi);
}

export async function getNotificationByConversation(
  env: Env,
  conversationId: string,
  page: number = 1,
  limit: number = 10
): Promise<Notification[]> {
  const prisma = getPrismaClient(env);
  const skip = (page - 1) * limit;

  const notifi = await prisma.notification.findMany({
    where: { conversationId },
    orderBy: { createdAt: "desc" },
    skip,
    take: limit,
  });

  return notifi.map((item) => new Notification(item));
}

export async function getNotificationsByUserId(
  env: Env,
  userId: string,
  page: number = 1,
  limit: number = 10
): Promise<Notification[]> {
  const prisma = getPrismaClient(env);
  const skip = (page - 1) * limit;

  const notifi = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    skip,
    take: limit,
  });

  return notifi.map((item) => new Notification(item));
}

export async function markNotificationAsRead(
  env: Env,
  notificationId: string
): Promise<Notification> {
  const prisma = getPrismaClient(env);
  const notifi = await prisma.notification.update({
    where: { id: notificationId },
    data: { isRead: true },
  });
  return new Notification(notifi);
}

export async function deleteNotification(
  env: Env,
  notificationId: string
): Promise<void> {
  const prisma = getPrismaClient(env);
  await prisma.notification.delete({
    where: { id: notificationId },
  });
}
