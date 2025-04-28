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
export { ChatRoom }; // Xuất khẩu class ChatRoom để Cloudflare Worker biết

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
// Updated app.get handler for WebSocket connections
app.get("/chat/websocket", async (c) => {
  try {
    const { conversationId, token } = c.req.query();

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

    console.log("WebSocket URL:", url.toString());

    // Forward request to Durable Object with all original headers
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

export default app;
