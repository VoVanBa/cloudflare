import { Conversation } from "./conversation";
import { NotificationType } from "./enums";
import { User } from "./user";

export class Notification {
  id: string;
  conversation?: Conversation;
  conversationId?: string;
  user: User;
  userId: string;
  title: string;
  content: string;
  type: NotificationType;
  isRead: boolean;
  createdAt: Date;

  constructor(data: any) {
    this.id = data.id!;
    this.conversation = data.conversation;
    this.conversationId = data.conversationId;
    this.user = data.user!;
    this.userId = data.userId!;
    this.title = data.title!;
    this.content = data.content!;
    this.type = data.type!;
    this.isRead = data.isRead ?? false;
    this.createdAt = data.createdAt!;
  }
}
