export const MEDIA_ERRORS = {
  UPLOAD_FAILED: "Upload failed",
} as const;

export type MediaErrorType = keyof typeof MEDIA_ERRORS;
