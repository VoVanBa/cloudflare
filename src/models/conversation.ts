import { Business } from "./business";
import { ClientType } from "./enums";
import { User } from "./user";

export class Conversation {
  id: string;
  business: Business;
  businessId: string;
  guestId?: number;
  clientType: ClientType;
  user?: User;
  userId?: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;

  constructor(data: Partial<Conversation>) {
    this.id = data.id!;
    this.business = data.business!;
    this.businessId = data.businessId!;
    this.guestId = data.guestId;
    this.clientType = data.clientType!;
    this.user = data.user;
    this.userId = data.userId;
    this.messages = data.messages || [];
    this.createdAt = data.createdAt!;
    this.updatedAt = data.updatedAt!;
    this.deletedAt = data.deletedAt;
  }
}
