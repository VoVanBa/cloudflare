import { Hono } from "hono";
import { Context } from "hono";
import { login, register, validate } from "../services/user.service";
import { CreateUserDto } from "../dtos/request/user.dto";

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
