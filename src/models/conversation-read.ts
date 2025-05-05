import { Conversation } from "./conversation";
import { User } from "./user";

export class ConversationRead {
  id: string;
  userId: string;
  conversationId: string;
  lastReadAt: Date;
  user: User;
  conversation: Conversation;

  constructor(data: any) {
    this.id = data.id!;
    this.userId = data.userId!;
    this.conversationId = data.conversationId!;
    this.lastReadAt = data.lastReadAt || new Date();
    this.user = data.user;
    this.conversation = data.conversation;
  }
}
