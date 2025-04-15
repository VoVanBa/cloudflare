import { Hono } from "hono";
import { CreateBusinessRequestDto } from "../dtos/request/business.dto";
import { create } from "../services/business.service";
import { getUserByToken } from "../services/user.service";

export const businessRoute = new Hono<{ Bindings: Env }>();
businessRoute.post("/", async (c) => {
  const body = await c.req.json();
  try {
    // Validate the request body
    const token = c.req.header("Authorization");
    console.log("token", token);
    if (!token) {
      return c.json({ error: "Missing token" }, 401);
    }
    const user = await getUserByToken(c.env, token);
    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }
    const userData: CreateBusinessRequestDto = {
      name: body.name,
    };

    const result = await create(c.env, userData, user.id);
    return c.json(result);
  } catch (err) {
    return c.json({ error: err.message }, 400);
  }
});
