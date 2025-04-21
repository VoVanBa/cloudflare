import { Hono } from "hono";
import { uploadMultipleImagesToCloudinary } from "../services/media.service";

export const mediaRoute = new Hono<{ Bindings: Env }>();

mediaRoute.post("/upload", async (c) => {
  const env = c.env;
  const formData = await c.req.formData();

  const files = formData
    .getAll("files")
    .filter((f) => f instanceof File) as File[];

  if (files.length === 0) {
    return c.json({ error: "No valid files uploaded" }, 400);
  }

  try {
    const result = await uploadMultipleImagesToCloudinary(files, env);
    return c.json(result); // gồm { count, uploaded }
  } catch (err: any) {
    return c.json({ error: err.message || "Upload failed" }, 500);
  }
});
