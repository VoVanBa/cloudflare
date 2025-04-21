export const getCloudinaryConfig = (env: Env) => ({
  cloudName: env.CLOUDINARY_CLOUD_NAME,
  apiKey: env.CLOUDINARY_API_KEY,
  apiSecret: env.CLOUDINARY_API_SECRET,
});
