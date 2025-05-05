interface Env {
  DB: D1Database; // Binding cho D1
  JWT_SECRET: string;
  CLOUDINARY_CLOUD_NAME: string;
  CLOUDINARY_API_KEY: string;
  CLOUDINARY_API_SECRET: string;
  CLOUDINARY_UPLOAD_PRESET: string;
  NOTIFICATION_ROOM: DurableObjectNamespace;
  KV: KVNamespace;
}
