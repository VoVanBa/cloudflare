import { Hono } from "hono";
import { getConversationId } from "../repositories/conversation.repository";

export const conversationRoute = new Hono();

conversationRoute.get("/", async (c) => {
  const userId = c.req.query("userId");
  const businessId = c.req.query("businessId");

  if (!userId || !businessId) {
    return c.json({ error: "Missing userId or businessId" }, 400);
  }

  try {
    const conversation = await getConversationId(c.env, userId, businessId);
    return c.json({ conversationId: conversation.id });
  } catch (error) {
    console.error("Error fetching/creating conversation:", error);
    return c.json({ error: "Internal Server Error" }, 500);
  }
});
