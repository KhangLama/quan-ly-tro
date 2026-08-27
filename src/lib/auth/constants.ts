export const AUTH_COOKIE_NAME = "auth_session";

export const AUTH_COOKIE_MAX_AGE = 7 * 24 * 60 * 60; // 7 days in seconds
export const AUTH_COOKIE_MAX_AGE_MS = AUTH_COOKIE_MAX_AGE * 1000;

export const AUTH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: AUTH_COOKIE_MAX_AGE,
};

export const DEFAULT_ADMIN_PASSWORD = "tro123456";

export function getAdminPassword(): string {
  return process.env.ADMIN_PASSWORD || DEFAULT_ADMIN_PASSWORD;
}
