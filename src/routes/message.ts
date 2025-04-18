import { Hono } from "hono";
import {
  getAllMessage,
  getMessageById,
  createMessage,
  updateMessage,
} from "../services/message.service";
import {
  CreateMessageDto,
  UpdateMessageDto,
} from "../dtos/request/message.dto";

export const messageRoute = new Hono<{ Bindings: Env }>();

// Get all messages for a conversation
messageRoute.get("/:conversationId", async (c) => {
  const conversationId = c.req.param("conversationId");

  // Lấy tham số phân trang từ query string, mặc định là page 1 và pageSize 10
  const page = parseInt(c.req.query("page") || "1", 10);
  const pageSize = parseInt(c.req.query("pageSize") || "10", 10);

  if (!conversationId) {
    return c.json({ error: "Missing conversationId" }, 400);
  }

  try {
    // Gọi hàm getMessage với các tham số phân trang
    const messages = await getAllMessage(c.env, conversationId, page, pageSize);
    return c.json(messages);
  } catch (error) {
    console.error("Error fetching messages:", error);
    return c.json({ error: "Internal Server Error" }, 500);
  }
});

// Get a single message by ID
messageRoute.get("/message/:messageId", async (c) => {
  const messageId = c.req.param("messageId");

  if (!messageId) {
    return c.json({ error: "Missing messageId" }, 400);
  }

  try {
    const message = await getMessageById(c.env, messageId);
    if (!message) {
      return c.json({ error: "Message not found" }, 404);
    }
    return c.json(message);
  } catch (error) {
    console.error("Error fetching message:", error);
    return c.json({ error: "Internal Server Error" }, 500);
  }
});

// Create a new message
messageRoute.post("/", async (c) => {
  const body = await c.req.json<CreateMessageDto>();

  if (!body || !body.conversationId || !body.content) {
    return c.json({ error: "Missing required fields" }, 400);
  }

  try {
    const message = await createMessage(c.env, body);
    return c.json(message, 201);
  } catch (error) {
    console.error("Error creating message:", error);
    return c.json({ error: "Internal Server Error" }, 500);
  }
});

// Update an existing message
messageRoute.put("/:messageId", async (c) => {
  const messageId = c.req.param("messageId");
  const body = await c.req.json<UpdateMessageDto>();

  if (!messageId) {
    return c.json({ error: "Missing messageId" }, 400);
  }

  try {
    const message = await updateMessage(c.env, messageId, body);
    if (!message) {
      return c.json({ error: "Message not found" }, 404);
    }
    return c.json(message);
  } catch (error) {
    console.error("Error updating message:", error);
    return c.json({ error: "Internal Server Error" }, 500);
  }
});
