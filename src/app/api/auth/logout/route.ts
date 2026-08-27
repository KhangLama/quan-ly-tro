import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE_NAME } from "@/lib/auth/constants";

export async function POST(request: NextRequest) {
  const response = NextResponse.json({
    success: true,
    message: "Đăng xuất thành công",
  });

  response.cookies.delete(AUTH_COOKIE_NAME);
  return response;
}

export async function GET(request: NextRequest) {
  const url = new URL("/login", request.url);
  const response = NextResponse.redirect(url);
  response.cookies.delete(AUTH_COOKIE_NAME);
  return response;
}
