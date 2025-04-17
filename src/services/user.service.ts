import { CreateUserDto, UpdateUserDto } from "../dtos/request/user.dto";
import { LoginResponseDto } from "../dtos/response/auth/login.dto";
import ms from "ms";
import {
  createUser,
  getUserByEmail,
  getUserById,
  updateUser,
} from "../repositories/user.repository";
import { signToken, verifyToken } from "../untils/jwt";
import * as bcrypt from "bcryptjs";
export const validateUser = async (env: Env, email: string) => {
  const user = await getUserByEmail(env, email);
  if (!user) throw new Error("User not found");
  return user;
};

export const register = async (env: Env, data: CreateUserDto) => {
  const existingUser = await getUserByEmail(env, data.email);
  if (existingUser) throw new Error("User already exists");
  const hashedPassword = await hashPassword(data.password);
  const user = await createUser(env, {
    ...data,
    password: hashedPassword,
  });

  return {
    message: "User created successfully",
  };
};

export const login = async (
  env: Env,
  email: string,
  password: string
): Promise<any> => {
  console.log("login", email, password);
  const user = await getUserByEmail(env, email);
  if (!user) throw new Error("User not found");

  const check = await comparePassword(password, user.password);
  if (!check) throw new Error("Invalid password");
  const payload = {
    id: user.id,
    email: user.email,
    expiresIn: ms("1h"),
  };
  const token = await signToken(payload);
  if (!token) throw new Error("Failed to generate token");
  return {
    token,
    user: {
      id: user.id,
      role: user.role,
    },
  };
};

export const validate = async (token: string) => {
  const header = token.split(" ")[1];
  const payload = await verifyToken(header);
  if (!payload) throw new Error("Invalid token");
  return payload;
};

export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(password, saltRounds);
  return hashedPassword;
};

export const getUserByToken = async (env: Env, token: string): Promise<any> => {
  const payload = await validate(token);
  console.log("payload", payload);

  if (typeof payload.id !== "string") {
    throw new Error("Invalid token payload: id is not a string");
  }
  const user = await getUserById(env, payload.id);
  if (!user) throw new Error("User not found");
  return user;
};

export const comparePassword = async (
  password: string,
  hashedPassword: string
): Promise<boolean> => {
  const isMatch = await bcrypt.compare(password, hashedPassword);
  return isMatch;
};

export const getUser = async (env: Env, id: string) => {
  const user = await getUserById(env, id);
  if (!user) throw new Error("User not found");
  return user;
};

export const updateBusinesIdToUser = async (
  env: Env,
  id: string,
  data: UpdateUserDto
) => {
  const updatedUser = await updateUser(env, id, data);
  return updatedUser;
};

export const updateUserData = async (
  env: Env,
  id: string,
  data: UpdateUserDto
) => {
  const updatedUser = await updateUser(env, id, data);
  return updatedUser;
};

export const getUserDetails= async (env: Env, id: string) => {
  const user = await getUserById(env, id);
  if (!user) throw new Error("User not found");
  return user;
}