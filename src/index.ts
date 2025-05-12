import { Hono } from "hono";
import { authRoute } from "./routes/auth";
import { conversationRoute } from "./routes/conversation";
import * as dotenv from "dotenv";
import { businessRoute } from "./routes/business";
import { cors } from "hono/cors";
import { messageRoute } from "./routes/message";
import { ChatRoom } from "./websocket/durable-object/chat-room.object"; // Import class ChatRoom từ nơi bạn đã định nghĩa
import { Env } from "./types";
import { mediaRoute } from "./routes/media";
import { notifiRoute } from "./routes/notification";
import { adminAssignmentRoute } from "./routes/admin-assignment";
export { ChatRoom }; // Xuất khẩu class ChatRoom để Cloudflare Worker biết
export { NotificationRoom } from "./websocket/durable-object/nottifi-room.object"; // Xuất khẩu class NotificationRoom để Cloudflare Worker biết

dotenv.config();

const app = new Hono<Env>();
app.use("*", async (c, next) => {
  if (c.req.header("upgrade")?.toLowerCase() !== "websocket") {
    return cors({
      origin: "http://localhost:3000",
      credentials: true,
      allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    })(c, next);
  } else {
    return next();
  }
});
app.get("/", (c) => c.text("Hello from ES Module Worker!"));
app.route("/auth", authRoute);
app.route("/conversation", conversationRoute);
app.route("/business", businessRoute);
app.route("/messages", messageRoute);
app.route("/media", mediaRoute);
app.route("/notification", notifiRoute);
app.route("/admin-assignment", adminAssignmentRoute);
app.get("/chat/websocket", async (c) => {
  try {
    const { conversationId, token, businessId } = c.req.query();

    // Validate required parameters
    if (!conversationId || !token) {
      return new Response(
        "Missing required parameters: conversationId and token",
        { status: 400 }
      );
    }

    // Check if it's a WebSocket request
    const upgradeHeader = c.req.header("Upgrade");
    if (upgradeHeader?.toLowerCase() !== "websocket") {
      return new Response("Expected Upgrade: websocket", { status: 426 });
    }

    // Get Durable Object for this chat room
    const roomId = c.env.CHAT_ROOMS.idFromName(conversationId);
    const stub = c.env.CHAT_ROOMS.get(roomId);

    // Create URL for Durable Object fetch
    const url = new URL(c.req.url);
    url.pathname = "/websocket";
    url.searchParams.set("conversationId", conversationId);
    url.searchParams.set("token", token);

    const response = await stub.fetch(url.toString(), {
      headers: c.req.raw.headers,
      method: c.req.method,
    });

    // Return the response directly
    return response;
  } catch (error) {
    console.error("WebSocket connection error:", error);
    return new Response(`WebSocket initialization error: ${error.message}`, {
      status: 500,
    });
  }
});
app.get("/notification/connect", async (c) => {
  try {
    // Lấy query parameters
    const { token, businessId } = c.req.query();

    // Validate required parameters
    if (!token || !businessId) {
      return c.json(
        { error: "Missing required parameters: token and businessId" },
        400
      );
    }

    // Kiểm tra header Upgrade
    const upgradeHeader = c.req.header("Upgrade");
    if (upgradeHeader?.toLowerCase() !== "websocket") {
      return c.json({ error: "Expected Upgrade: websocket" }, 426);
    }

    // Lấy Durable Object cho businessId
    const roomId = c.env.NOTIFICATION_ROOM.idFromName(businessId);
    const stub = c.env.NOTIFICATION_ROOM.get(roomId);

    // Tạo URL cho Durable Object
    const url = new URL(c.req.url);
    url.pathname = "/connect";
    url.searchParams.set("token", token);
    url.searchParams.set("businessId", businessId);

    console.log("Notification WebSocket URL:", url.toString());

    // Chuyển tiếp yêu cầu đến Durable Object
    const response = await stub.fetch(url.toString(), {
      method: c.req.method,
      headers: c.req.raw.headers,
    });

    return response;
  } catch (error) {
    console.error("Notification connection error:", error);
    return c.json(
      { error: `Notification initialization error: ${error.message}` },
      500
    );
  }
});
export default app;
