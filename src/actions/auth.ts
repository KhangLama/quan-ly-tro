"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  AUTH_COOKIE_NAME,
  AUTH_COOKIE_OPTIONS,
  getAdminPassword,
} from "@/lib/auth/constants";
import { createAuthToken, verifyAuthToken } from "@/lib/auth/session";

export interface LoginResult {
  success: boolean;
  error?: string;
}

/**
 * Server action to validate password and set auth session cookie
 */
export async function loginAdmin(password: string): Promise<LoginResult> {
  if (!password || typeof password !== "string") {
    return {
      success: false,
      error: "Vui lòng nhập mật khẩu",
    };
  }

  const adminPassword = getAdminPassword();
  if (password.trim() !== adminPassword.trim()) {
    return {
      success: false,
      error: "Mật khẩu không chính xác",
    };
  }

  const token = await createAuthToken();
  const cookieStore = cookies();
  cookieStore.set(AUTH_COOKIE_NAME, token, AUTH_COOKIE_OPTIONS);

  return { success: true };
}

/**
 * Server action to clear session cookie and redirect to login
 */
export async function logoutAdmin(): Promise<void> {
  const cookieStore = cookies();
  cookieStore.delete(AUTH_COOKIE_NAME);
  redirect("/login");
}

/**
 * Server action to check if current request has a valid session
 */
export async function checkAuth(): Promise<boolean> {
  const cookieStore = cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  if (!token) return false;
  return verifyAuthToken(token);
}
