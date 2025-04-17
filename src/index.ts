import { Hono } from "hono";
import { authRoute } from "./routes/auth";
import { conversationRoute } from "./routes/conversation";
import * as dotenv from "dotenv";
import { businessRoute } from "./routes/business";
import { cors } from "hono/cors";
import { messageRoute } from "./routes/message";
dotenv.config();

const app = new Hono();
app.use(
  "*",
  cors({
    origin: "http://localhost:3000",
    credentials: true,
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  })
);
app.get("/", (c) => c.text("Hello from ES Module Worker!"));
app.route("/auth", authRoute);
app.route("/conversation", conversationRoute);
app.route("/business", businessRoute);
app.route("/messages", messageRoute);
export default app;

export interface Env {
  DB: D1Database;
}
