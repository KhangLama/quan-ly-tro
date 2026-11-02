import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Same-Origin VietQR Proxy Route Handler
 * Eliminates browser CORS blocks and 301 redirect issues with VietQR servers.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const bank = (searchParams.get("bank") || searchParams.get("bankCode") || "MB").trim().toUpperCase();
    const account = (searchParams.get("account") || searchParams.get("accountNumber") || "").replace(/[^a-zA-Z0-9]/g, "");
    const amount = Math.max(0, parseInt(searchParams.get("amount") || "0", 10));
    const desc = searchParams.get("desc") || searchParams.get("description") || searchParams.get("addInfo") || "";
    const name = searchParams.get("name") || searchParams.get("accountName") || "";

    if (!account) {
      return new NextResponse("Thiếu số tài khoản ngân hàng", { status: 400 });
    }

    // Direct VietQR SVG endpoint (avoids 301 redirect from .png that lacks CORS headers)
    let targetUrl = `https://img.vietqr.io/image/${bank}-${account}-qr_only.svg?amount=${amount}`;
    if (desc) {
      targetUrl += `&addInfo=${encodeURIComponent(desc)}`;
    }
    if (name) {
      targetUrl += `&accountName=${encodeURIComponent(name)}`;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    let upstreamRes: Response;
    try {
      upstreamRes = await fetch(targetUrl, {
        signal: controller.signal,
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          Accept: "image/svg+xml,image/*,*/*",
        },
      });
    } finally {
      clearTimeout(timeoutId);
    }

    // If .svg returned an error, attempt .png with automatic redirect following
    if (!upstreamRes.ok) {
      let pngUrl = `https://img.vietqr.io/image/${bank}-${account}-qr_only.png?amount=${amount}`;
      if (desc) pngUrl += `&addInfo=${encodeURIComponent(desc)}`;
      if (name) pngUrl += `&accountName=${encodeURIComponent(name)}`;

      const fallbackRes = await fetch(pngUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
        redirect: "follow",
      });

      if (!fallbackRes.ok) {
        return new NextResponse("Không thể tải mã QR từ VietQR", { status: fallbackRes.status });
      }

      const buffer = await fallbackRes.arrayBuffer();
      const contentType = fallbackRes.headers.get("content-type") || "image/svg+xml";

      return new NextResponse(buffer, {
        status: 200,
        headers: {
          "Content-Type": contentType,
          "Cache-Control": "public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800",
          "Access-Control-Allow-Origin": "*",
        },
      });
    }

    const contentType = upstreamRes.headers.get("content-type") || "image/svg+xml; charset=utf-8";
    const buffer = await upstreamRes.arrayBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (err: any) {
    console.error("[/api/qr] Lỗi tải QR từ VietQR:", err);
    return new NextResponse(err.message || "Lỗi máy chủ proxy QR", { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "*",
    },
  });
}
