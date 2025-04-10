import { Conversation } from "./conversation";
import { User } from "./user";

export class Business {
  id: string;
  name: string;
  users: User[];
  conversations: Conversation[];
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;

  constructor(data: Partial<Business>) {
    this.id = data.id!;
    this.name = data.name!;
    this.users = data.users || [];
    this.conversations = data.conversations || [];
    this.createdAt = data.createdAt!;
    this.updatedAt = data.updatedAt!;
    this.deletedAt = data.deletedAt;
  }
}
