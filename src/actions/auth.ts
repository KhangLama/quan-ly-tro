"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  AUTH_COOKIE_NAME,
  AUTH_COOKIE_OPTIONS,
} from "../lib/auth/constants.ts";
import { createAuthToken, verifyAuthToken } from "../lib/auth/session.ts";
import {
  hashAdminPassword,
  saveAdminPasswordHash,
  verifyAdminPassword,
} from "../lib/auth/password.ts";

export interface LoginResult {
  success: boolean;
  error?: string;
}

export interface ChangePasswordResult {
  success: boolean;
  error?: string;
  message?: string;
}

/**
 * Server action to validate password and set auth session cookie
 */
export async function loginAdmin(password: string): Promise<LoginResult> {
  if (!password || typeof password !== "string" || !password.trim()) {
    return {
      success: false,
      error: "Vui lòng nhập mật khẩu",
    };
  }

  const isValid = await verifyAdminPassword(password);
  if (!isValid) {
    return {
      success: false,
      error: "Mật khẩu không chính xác",
    };
  }

  const token = await createAuthToken();
  try {
    const cookieStore = cookies();
    cookieStore.set(AUTH_COOKIE_NAME, token, AUTH_COOKIE_OPTIONS);
  } catch {
    // Ignored when called outside Next.js request context (e.g. unit tests)
  }

  return { success: true };
}

/**
 * Server action to change admin password and persist SHA-256 hash in Supabase settings
 */
export async function changeAdminPassword(
  currentPassword: string,
  newPassword: string,
  confirmPassword?: string
): Promise<ChangePasswordResult> {
  if (
    !currentPassword ||
    typeof currentPassword !== "string" ||
    !currentPassword.trim()
  ) {
    return {
      success: false,
      error: "Vui lòng nhập mật khẩu hiện tại",
    };
  }

  if (
    !newPassword ||
    typeof newPassword !== "string" ||
    !newPassword.trim()
  ) {
    return {
      success: false,
      error: "Vui lòng nhập mật khẩu mới",
    };
  }

  const trimmedCurrent = currentPassword.trim();
  const trimmedNew = newPassword.trim();

  if (trimmedNew.length < 6) {
    return {
      success: false,
      error: "Mật khẩu mới phải có ít nhất 6 ký tự",
    };
  }

  if (
    confirmPassword !== undefined &&
    trimmedNew !== (confirmPassword || "").trim()
  ) {
    return {
      success: false,
      error: "Mật khẩu xác nhận không khớp",
    };
  }

  const isCurrentValid = await verifyAdminPassword(trimmedCurrent);
  if (!isCurrentValid) {
    return {
      success: false,
      error: "Mật khẩu hiện tại không chính xác",
    };
  }

  if (trimmedCurrent === trimmedNew) {
    return {
      success: false,
      error: "Mật khẩu mới phải khác mật khẩu hiện tại",
    };
  }

  const newHash = await hashAdminPassword(trimmedNew);
  const saveRes = await saveAdminPasswordHash(newHash);
  if (!saveRes.success) {
    return {
      success: false,
      error: saveRes.error || "Không thể lưu mật khẩu mới. Vui lòng thử lại!",
    };
  }

  try {
    const token = await createAuthToken();
    const cookieStore = cookies();
    cookieStore.set(AUTH_COOKIE_NAME, token, AUTH_COOKIE_OPTIONS);
  } catch {
    // Ignored when called outside Next.js request context (e.g. unit tests)
  }

  return {
    success: true,
    message: "Đổi mật khẩu quản trị viên thành công!",
  };
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
