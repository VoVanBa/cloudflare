import { NotificationType } from "../../models/enums";

export interface NotificationDto {
  userId: string | null;
  title: string;
  content: string;
  type: NotificationType;
  conversationId: string;
}
