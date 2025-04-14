import { CreateUserDto, UpdateUserDto } from "../dtos/request/user.dto";
import { User } from "../models/user";
import { getPrismaClient } from "../untils/db";

export async function createUser(env: Env, data: CreateUserDto): Promise<User> {
  const prisma = getPrismaClient(env);
  const user = await prisma.user.create({
    data: {
      ...data,
      createdAt: new Date(),
    },
  });
  return new User({ user });
}

export async function getUserById(env: Env, id: string): Promise<User | null> {
  const prisma = getPrismaClient(env);
  const user = await prisma.user.findUnique({
    where: {
      id,
      deletedAt: null,
    },
  });
  return user ? new User({ user }) : null;
}

export async function updateUser(
  env: Env,
  id: string,
  data: UpdateUserDto
): Promise<void> {
  const prisma = getPrismaClient(env);
  prisma.user.update({
    where: {
      id,
      deletedAt: null,
    },
    data: {
      ...data,
      updatedAt: new Date(),
    },
  });
}

export async function deleteUser(env: Env, id: string): Promise<void> {
  const prisma = getPrismaClient(env);
  // Soft delete
  prisma.user.update({
    where: {
      id,
      deletedAt: null,
    },
    data: {
      deletedAt: new Date(),
    },
  });
}

export async function getUserByEmail(
  env: Env,
  email: string
): Promise<User | null> {
  const prisma = getPrismaClient(env);
  const user = await prisma.user.findFirst({
    where: {
      email,
    },
  });
  return user ? new User(user) : null;
}
