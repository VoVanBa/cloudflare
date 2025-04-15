import { Hono } from "hono";
import { authRoute } from "./routes/auth";
import { conversationRoute } from "./routes/conversation";
import * as dotenv from "dotenv";
import { businessRoute } from "./routes/business";
dotenv.config();

const app = new Hono();

app.get("/", (c) => c.text("Hello from ES Module Worker!"));
app.route("/auth", authRoute);
app.route("/conversation", conversationRoute);
app.route("/business", businessRoute);

export default app;

export interface Env {
  DB: D1Database;
}
