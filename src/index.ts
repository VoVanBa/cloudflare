import { Hono } from "hono";
import { authRoute } from "./routes/auth";
import { conversationRoute } from "./routes/conversation";
import * as dotenv from "dotenv";
import { businessRoute } from "./routes/business";
import { cors } from "hono/cors";
import { messageRoute } from "./routes/message";
import { ChatRoom } from "./websocket/durable-object/chat-room.object"; // Import class ChatRoom từ nơi bạn đã định nghĩa
import { Env } from "./types";
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
app.get("/chat/websocket", async (c) => {
  console.log();
  const { conversationId, userId, isAdmin } = c.req.query();

  const roomId = c.env.CHAT_ROOMS.idFromName(conversationId);
  const stub = c.env.CHAT_ROOMS.get(roomId);

  const url = new URL(c.req.url);
  url.pathname = "/websocket";
  url.searchParams.set("conversationId", conversationId);
  url.searchParams.set("userId", userId);
  url.searchParams.set("isAdmin", isAdmin || "false");

  const upgradeHeader = c.req.header("Upgrade");
  if (upgradeHeader?.toLowerCase() !== "websocket") {
    return new Response("Expected Upgrade: websocket", { status: 426 });
  }

  const res = await stub.fetch(url.toString(), {
    headers: c.req.raw.headers,
  });

  console.log("WS upgrade response status:", res.status); // 👀 debug

  return res;
});

export default app;
