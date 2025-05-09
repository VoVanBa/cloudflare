import { Hono } from "hono";
import {
  createConversation,
  deleteConversationbyId,
  getAllConversations,
  getConversationMessage,
} from "../services/conversation.service";
import { getUserByToken } from "../services/user.service";
import { markAsRead } from "../services/notification.service";
import {
  getUnreadCount,
  markConversationAsRead,
} from "../services/conversation-read.service";

export const conversationRoute = new Hono<{ Bindings: Env }>();

conversationRoute.get("get-by-id/:conversationId", async (c) => {
  const conversationId = c.req.param("conversationId");

  // Nhận page và limit từ query param, mặc định nếu không truyền
  const page = parseInt(c.req.query("page") || "1", 10);
  const limit = parseInt(c.req.query("limit") || "10", 10);

  try {
    const { messages, totalCount } = await getConversationMessage(
      c.env,
      conversationId,
      page,
      limit
    );

    return c.json({
      messages,
      pagination: {
        page,
        limit,
        totalCount,
        hasMore: page * limit < totalCount,
      },
    });
  } catch (error) {
    console.error("Error fetching/creating conversation:", error);
    return c.json({ error: "Internal Server Error" }, 500);
  }
});

conversationRoute.put("mark-as-read/:conversationId", async (c) => {
  const conversationId = c.req.param("conversationId");
  const authHeader = c.req.header("Authorization");
  const user = await getUserByToken(c.env, authHeader);
  try {
    const conversation = await markAsRead(c.env, conversationId);
    return c.json({
      conversationId: conversation.id,
    });
  } catch (error) {
    console.error("Error creating conversation:", error);
    return c.json({ error: "Internal Server Error" }, 500);
  }
});

conversationRoute.get("all/:businessId", async (c) => {
  const businessId = c.req.param("businessId");
  const page = Number(c.req.query("page")) || 1;
  const limit = Number(c.req.query("limit")) || 10;
  const authHeader = c.req.header("Authorization");
  const user = await getUserByToken(c.env, authHeader);
  const userId = user?.id;
  if (!userId) {
    return c.json({ error: "Missing userId" }, 400);
  }
  if (!businessId) {
    return c.json({ error: "Missing conversationId" }, 400);
  }
  try {
    const conversation = await getAllConversations(
      c.env,
      businessId,
      userId,
      page,
      limit
    );
    return c.json({ conversation });
  } catch (error) {
    console.error("Error fetching conversation:", error);
    return c.json({ error: "Internal Server Error" }, 500);
  }
});

conversationRoute.post("/", async (c) => {
  const body = await c.req.json();
  const businessId = body.businessId;
  const authHeader = c.req.header("Authorization");

  if (!businessId) {
    return c.json({ error: "Missing businessId" }, 400);
  }

  try {
    const user = await getUserByToken(c.env, authHeader);
    const userId = user?.id;
    const data = {
      businessId,
      userId,
    };

    const conversation = await createConversation(c.env, data);
    return c.json({
      conversationId: conversation.id,
    });
  } catch (error) {
    console.error("Error creating conversation:", error);
    return c.json({ error: "Internal Server Error" }, 500);
  }
});

conversationRoute.delete("/:id", async (c) => {
  const conversationId = c.req.param("id");
  if (!conversationId) {
    return c.json({ error: "Missing conversationId" }, 400);
  }
  try {
    await deleteConversationbyId(c.env, conversationId);
    return c.json({ message: "Conversation deleted successfully" });
  } catch (error) {
    console.error("Error deleting conversation:", error);
    return c.json({ error: "Internal Server Error" }, 500);
  }
});

conversationRoute.put("/:conversationId/read", async (c) => {
  const { conversationId } = c.req.param();
  const authHeader = c.req.header("Authorization");
  const user = await getUserByToken(c.env, authHeader);
  const userId = user?.id;
  if (!userId) {
    return c.json({ error: "Missing userId" }, 400);
  }
  if (!conversationId) {
    return c.json({ error: "Missing conversationId" }, 400);
  }

  try {
    const conversationRead = await markConversationAsRead(
      c.env,
      userId,
      conversationId
    );
    return c.json(conversationRead, 200);
  } catch (error) {
    console.error("Error in route handler:", error);
    return c.json({ error: "Failed to mark conversation as read" }, 500);
  }
});

conversationRoute.get("/:conversationId/unread-count", async (c) => {
  const { conversationId } = c.req.param();
  const authHeader = c.req.header("Authorization");
  const user = await getUserByToken(c.env, authHeader);
  const userId = user?.id;
  if (!userId) {
    return c.json({ error: "Missing userId" }, 400);
  }
  if (!conversationId) {
    return c.json({ error: "Missing conversationId" }, 400);
  }

  try {
    const unreadCount = await getUnreadCount(c.env, conversationId, userId);
    return c.json({ count: unreadCount }, 200);
  } catch (error) {
    console.error("Error in route handler:", error);
    return c.json({ error: "Failed to fetch unread count" }, 500);
  }
});
