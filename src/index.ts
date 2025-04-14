import { Hono } from "hono";
import { authRoute } from "./routes/auth";
import * as dotenv from "dotenv";
dotenv.config();

const app = new Hono();

app.get("/", (c) => c.text("Hello from ES Module Worker!"));
app.route("/auth", authRoute);

export default app;

export interface Env {
  DB: D1Database;
}
