import { jwt } from "hono/jwt";
import { MiddlewareHandler } from "hono";

export const authMiddleware: MiddlewareHandler = jwt({
  secret: "your-secret-key",
  alg: "HS256",
});
