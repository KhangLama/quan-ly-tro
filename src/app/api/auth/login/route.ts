import { NextRequest, NextResponse } from "next/server";
import {
  AUTH_COOKIE_NAME,
  AUTH_COOKIE_OPTIONS,
  getAdminPassword,
} from "@/lib/auth/constants";
import { createAuthToken } from "@/lib/auth/session";

export async function POST(request: NextRequest) {
  try {
    let password = "";

    const contentType = request.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const body = await request.json();
      password = body.password || "";
    } else if (contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      password = (formData.get("password") as string) || "";
    }

    if (!password || typeof password !== "string") {
      return NextResponse.json(
        { success: false, message: "Vui lòng nhập mật khẩu" },
        { status: 400 }
      );
    }

    const adminPassword = getAdminPassword();
    if (password.trim() !== adminPassword.trim()) {
      return NextResponse.json(
        { success: false, message: "Mật khẩu không chính xác" },
        { status: 401 }
      );
    }

    const token = await createAuthToken();
    const response = NextResponse.json({
      success: true,
      message: "Đăng nhập thành công",
    });

    response.cookies.set(AUTH_COOKIE_NAME, token, AUTH_COOKIE_OPTIONS);
    return response;
  } catch {
    return NextResponse.json(
      { success: false, message: "Lỗi xử lý yêu cầu đăng nhập" },
      { status: 500 }
    );
  }
}
