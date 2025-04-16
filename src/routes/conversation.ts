import { Hono } from "hono";
import {
  createConversation,
  getAllConversations,
  getConversationId,
} from "../services/conversation.service";
import { getUserByToken } from "../services/user.service";
import { ClientType } from "../models/enums";

export const conversationRoute = new Hono<{ Bindings: Env }>();

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

conversationRoute.post("/:businessId", async (c) => {
  const token = c.req.header("Authorization");
  let userId: string | undefined;
  let guestId: string | undefined;

  if (token) {
    const user = await getUserByToken(c.env, token);
    if (user) {
      userId = user.id;
    }
  }

  const body = await c.req.json();
  const businessId = c.req.param("businessId");

  // Nếu không có token → tạo guestId tạm thời (ẩn danh)
  if (!userId) {
    // Nếu FE có gửi guestId (localStorage) thì dùng, còn không thì tự sinh
    guestId = body.guestId ?? crypto.randomUUID();
  }

  if (!businessId) {
    return c.json({ error: "Missing businessId" }, 400);
  }

  const data = {
    businessId,
    userId, // có thể undefined nếu là guest
    guestId, // có thể undefined nếu là user
    clientType: userId ? ClientType.AUTHENTICATED : ClientType.ANONYMOUS, // enum,
  };

  try {
    const conversation = await createConversation(c.env, data);
    return c.json({
      conversationId: conversation.id,
      guestId, // gửi lại FE để lưu vào localStorage (nếu là anonymous)
    });
  } catch (error) {
    console.error("Error fetching/creating conversation:", error);
    return c.json({ error: "Internal Server Error" }, 500);
  }
});

conversationRoute.get("/:businessId", async (c) => {
  const businessId = c.req.param("businessId");
  if (!businessId) {
    return c.json({ error: "Missing conversationId" }, 400);
  }
  try {
    const conversation = await getAllConversations(c.env, businessId);
    return c.json({ conversation });
  } catch (error) {
    console.error("Error fetching conversation:", error);
    return c.json({ error: "Internal Server Error" }, 500);
  }
});