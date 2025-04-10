import { Conversation } from "./conversation";
import { SenderType } from "./enums";
import { User } from "./user";

export class Message {
  id: string;
  conversation: Conversation;
  conversationId: string;
  senderType: SenderType;
  content: string;
  userId?: string;
  guestId?: string;
  createdAt: Date;
  deletedAt?: Date;
  user?: User;

  constructor(data: any) {
    this.id = data.id!;
    this.conversation = data.conversation!;
    this.conversationId = data.conversationId!;
    this.senderType = data.senderType!;
    this.content = data.content!;
    this.userId = data.userId;
    this.guestId = data.guestId;
    this.createdAt = data.createdAt!;
    this.deletedAt = data.deletedAt;
    this.user = data.user;
  }
}
