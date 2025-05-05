import { Hono } from "hono";
import { fetchNotifications } from "../services/notification.service";

export const notifiRoute = new Hono<{ Bindings: Env }>();

notifiRoute.get("/", async (c) => {
  const businessId = c.req.query("businessId");

  const page = parseInt(c.req.query("page") || "1", 10);
  const pageSize = parseInt(c.req.query("pageSize") || "10", 10);

  try {
    const notifi = await fetchNotifications(c.env, businessId, page, pageSize);
    return c.json(notifi, 200);
  } catch (error) {
    console.error("Error fetching messages:", error);
    return c.json({ error: "Internal Server Error" }, 500);
  }
});
