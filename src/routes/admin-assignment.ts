import { Hono, Context } from "hono";
import {
  assignAdminToConversation,
  getAdminAssignments,
  getAssignmentHistory,
  getAdminPerformance,
} from "../services/admin-assignment.service";
import { AssignmentStatus, UserRole } from "../models/enums";
import { checkRole } from "../middlewares/role.middleware";
import { User } from "../models/user";

type ContextWithUser = Context<{ Bindings: Env }> & {
  user?: User;
};

const adminAssignmentRoute = new Hono<{ Bindings: Env }>();

// Apply role middleware to all routes
adminAssignmentRoute.use("*", checkRole([UserRole.ADMIN]));

// Assign admin to conversation
adminAssignmentRoute.post("/assign", async (c: ContextWithUser) => {
  try {
    const { conversationId } = await c.req.json();
    const user = c.user;

    if (!conversationId) {
      return c.json(
        { error: "Missing required parameters: conversationId" },
        400
      );
    }

    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const assignment = await assignAdminToConversation(
      c.env,
      conversationId,
      user.id
    );
    return c.json(assignment);
  } catch (error) {
    console.error("Error assigning admin:", error);
    return c.json({ error: error.message }, 500);
  }
});

// Get admin's assignments
adminAssignmentRoute.get("/admin/:adminId", async (c: ContextWithUser) => {
  try {
    const adminId = c.req.param("adminId");
    const user = c.user;

    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    // Only allow admins to view their own assignments
    if (user.id !== adminId) {
      return c.json(
        { error: "Forbidden - Cannot view other admin's assignments" },
        403
      );
    }

    const status = c.req.query("status") as AssignmentStatus | undefined;
    const assignments = await getAdminAssignments(c.env, adminId, status);
    return c.json(assignments);
  } catch (error) {
    console.error("Error getting admin assignments:", error);
    return c.json({ error: error.message }, 500);
  }
});

// Get assignment history for a conversation
adminAssignmentRoute.get(
  "/conversation/:conversationId",
  async (c: ContextWithUser) => {
    try {
      const conversationId = c.req.param("conversationId");
      const history = await getAssignmentHistory(c.env, conversationId);
      return c.json(history);
    } catch (error) {
      console.error("Error getting assignment history:", error);
      return c.json({ error: error.message }, 500);
    }
  }
);

// Get admin performance metrics
adminAssignmentRoute.get(
  "/performance/:adminId",
  async (c: ContextWithUser) => {
    try {
      const adminId = c.req.param("adminId");
      const user = c.user;

      if (!user) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      // Only allow admins to view their own performance
      if (user.id !== adminId) {
        return c.json(
          { error: "Forbidden - Cannot view other admin's performance" },
          403
        );
      }

      const startDate = new Date(c.req.query("startDate") || "");
      const endDate = new Date(c.req.query("endDate") || "");

      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return c.json(
          {
            error:
              "Invalid date parameters. Please provide valid startDate and endDate",
          },
          400
        );
      }

      const performance = await getAdminPerformance(
        c.env,
        adminId,
        startDate,
        endDate
      );
      return c.json(performance);
    } catch (error) {
      console.error("Error getting admin performance:", error);
      return c.json({ error: error.message }, 500);
    }
  }
);

export { adminAssignmentRoute };
