import { User } from "./../models/user";
import { Hono } from "hono";
import { Context } from "hono";
import {
  getUserByToken,
  getUserDetails,
  login,
  register,
  updateUserData,
  validate,
} from "../services/user.service";
import { CreateUserDto, UpdateUserDto } from "../dtos/request/user.dto";

export const authRoute = new Hono<{ Bindings: Env }>();

authRoute.post("/register", async (c) => {
  const body = await c.req.json();
  try {
    const userData: CreateUserDto = {
      email: body.email,
      password: body.password,
      name: body.name,
    };

    const result = await register(c.env, userData);
    return c.json(result);
  } catch (err) {
    return c.json({ error: err.message }, 400);
  }
});

authRoute.post("/login", async (c) => {
  const { email, password } = await c.req.json();
  try {
    const result = await login(c.env, email, password);
    return c.json(result);
  } catch (err) {
    return c.json({ error: err.message }, 401);
  }
});

authRoute.get("/validate", async (c) => {
  const authHeader = c.req.header("Authorization");
  if (!authHeader) return c.json({ error: "Missing token" }, 401);

  const token = authHeader.replace("Bearer ", "");
  try {
    const payload = await validate(token);
    return c.json({ valid: true, payload });
  } catch (err) {
    return c.json({ error: err.message }, 401);
  }
});

authRoute.put("/update", async (c) => {
  try {
    const authHeader = c.req.header("Authorization");
    if (!authHeader) {
      return c.json({ error: "Missing token" }, 401);
    }
    const user = await getUserByToken(c.env, authHeader); // chú ý: truyền token đã cắt
    if (!user) {
      return c.json({ error: "Invalid token" }, 401);
    }

    const body = await c.req.json();
    const userData: UpdateUserDto = {
      name: body.name,
      role: body.role,
      businessId: body.businessId,
    };

    await updateUserData(c.env, user.id, userData);

    return c.json({ message: "User updated successfully" });
  } catch (err) {
    return c.json({ error: err.message }, 500);
  }
});

authRoute.get("/me", async (c) => {
  const authHeader = c.req.header("Authorization");
  if (!authHeader) return c.json({ error: "Missing token" }, 401);

  try {
    const user = await getUserByToken(c.env, authHeader);
    if (!user) return c.json({ error: "Invalid token" }, 401);
    const userDetail = await getUserDetails(c.env, user.id);
    return c.json(userDetail);
  } catch (err) {
    return c.json({ error: err.message }, 401);
  }
});
