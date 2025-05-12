export const COMMON_ERRORS = {
  NOT_FOUND: "Not found",
  UNAUTHORIZED: "Unauthorized",
  FORBIDDEN: "Forbidden",
  INTERNAL_SERVER_ERROR: "Internal server error",
} as const;

export type CommonErrorType = keyof typeof COMMON_ERRORS;
