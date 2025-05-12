export const USER_ERRORS = {
  USER_NOT_FOUND: "User not found",
  USER_ALREADY_EXISTS: "User already exists",
  INVALID_PASSWORD: "Invalid password",
  INVALID_TOKEN: "Invalid token",
  INVALID_TOKEN_PAYLOAD: "Invalid token payload: id is not a string",
  FAILED_TO_GENERATE_TOKEN: "Failed to generate token",
} as const;

export type UserErrorType = keyof typeof USER_ERRORS;
