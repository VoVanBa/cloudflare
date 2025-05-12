import { Context } from "hono";
import { getUserByToken } from "../services/user.service";
import { UserRole } from "../models/enums";
import { User } from "../models/user";

// Extend the Context type to include user
type ContextWithUser = Context<{ Bindings: Env }> & {
  user?: User;
};

export const checkRole = (allowedRoles: UserRole[]) => {
  return async (c: ContextWithUser, next: () => Promise<void>) => {
    try {
      const token = c.req.header("Authorization");
      if (!token) {
        return c.json({ error: "Unauthorized - No token provided" }, 401);
      }

      const user = await getUserByToken(c.env, token);
      if (!user) {
        return c.json({ error: "Unauthorized - Invalid token" }, 401);
      }

      if (!allowedRoles.includes(user.role)) {
        return c.json({ error: "Forbidden - Insufficient permissions" }, 403);
      }

      // Add user to context for use in route handlers
      c.user = user;
      await next();
    } catch (error) {
      console.error("Role check error:", error);
      return c.json({ error: "Internal server error" }, 500);
    }
  };
};
