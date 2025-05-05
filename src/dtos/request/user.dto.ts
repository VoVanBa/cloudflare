import { UserRole } from "../../models/enums";

export type CreateUserDto = {
  email: string;
  name?: string;
  password: string;
  role?: UserRole;
  businessId?: string;
};

export type UpdateUserDto = {
  name?: string;
  role?: UserRole;
  businessId?: string | null;
};

export type LoginDto = {
  email: string;
  password: string;
};

export type RegisterDto = {
  email: string;
  password: string;
  name?: string;
  role?: UserRole;
  businessId?: string;
};
