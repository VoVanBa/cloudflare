import { Business } from "./business";
import { Conversation } from "./conversation";
import { UserRole } from "./enums";

export class User {
  id: string;
  email: string;
  name?: string;
  role: UserRole;
  businessId?: string;
  business?: Business;
  conversations: Conversation[];
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;

  constructor(data: Partial<User>) {
    this.id = data.id!;
    this.email = data.email!;
    this.name = data.name;
    this.role = data.role || UserRole.CLIENT;
    this.businessId = data.businessId;
    this.business = data.business;
    this.conversations = data.conversations || [];
    this.messages = data.messages || [];
    this.createdAt = data.createdAt!;
    this.updatedAt = data.updatedAt!;
    this.deletedAt = data.deletedAt;
  }
}
