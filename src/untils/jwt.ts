import { sign, verify } from "hono/jwt";

const JWT_SECRET = "your-secret";

export const signToken = async (payload: any) => {
  return await sign(payload, JWT_SECRET);
};

export const verifyToken = async (token: string) => {
  try {
    return await verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
};
