import { CreateUserDto, UpdateUserDto } from "../dtos/request/user.dto";
import { UserRole } from "../models/enums";
import { User } from "../models/user";
import { getPrismaClient } from "../untils/db";

export async function createUser(env: Env, data: CreateUserDto): Promise<User> {
  const prisma = getPrismaClient(env);
  const user = await prisma.user.create({
    data: {
      ...data,
      role: UserRole.CLIENT,
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
    include: {
      conversations: {
        include: {
          business: true,
        },
      },
    },
  });
  return user ? new User(user) : null;
}

export async function getAllUserAdminByBusinessId(
  env: Env,
  businessId: string
): Promise<User[]> {
  const prisma = getPrismaClient(env);
  const users = await prisma.user.findMany({
    where: {
      businessId,
      role: UserRole.ADMIN,
    },
  });
  return users.map((user) => new User(user));
}
export async function updateUser(env: Env, id: string, data: UpdateUserDto) {
  const prisma = getPrismaClient(env);
  await prisma.user.update({
    where: {
      id,
      deletedAt: null,
    },
    data: {
      ...data,
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
