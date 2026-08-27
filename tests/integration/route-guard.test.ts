import { describe, it, expect } from "vitest";
import {
  signSessionToken,
  verifySessionToken,
  createAuthToken,
  verifyAuthToken,
} from "../../src/lib/auth/session.ts";
import {
  AUTH_COOKIE_NAME,
  AUTH_COOKIE_MAX_AGE,
  AUTH_COOKIE_MAX_AGE_MS,
  AUTH_COOKIE_OPTIONS,
  DEFAULT_ADMIN_PASSWORD,
  getAdminPassword,
} from "../../src/lib/auth/constants.ts";

describe("Integration Test: Route Guard & Middleware Protection Suite", () => {
  const ADMIN_SECRET = getAdminPassword();

  // Helper simulating Next.js Edge Middleware route guard logic
  async function simulateMiddleware(
    urlOrPath: string,
    cookieToken?: string | null
  ): Promise<{
    action: "next" | "redirect" | "unauthorized";
    status?: number;
    redirectUrl?: string;
    body?: any;
  }> {
    // Parse URL / Pathname
    let pathname = urlOrPath;
    let urlObj: URL;
    try {
      urlObj = new URL(urlOrPath, "http://localhost:3000");
      pathname = urlObj.pathname;
    } catch {
      pathname = urlOrPath.split("?")[0].split("#")[0];
    }

    // 1. Static asset exclusion
    if (
      pathname.startsWith("/_next") ||
      pathname.startsWith("/static") ||
      pathname.includes(".") || // files with extensions (e.g. .ico, .png, .svg)
      pathname === "/favicon.ico"
    ) {
      return { action: "next", status: 200 };
    }

    const isAuthenticated = await verifySessionToken(cookieToken, ADMIN_SECRET);
    const isLoginPage = pathname === "/login" || pathname === "/login/";
    const isPublicApiAuth =
      pathname === "/api/auth/login" ||
      pathname === "/api/auth/logout" ||
      pathname === "/api/auth/login/" ||
      pathname === "/api/auth/logout/";

    // 2. Authenticated user visiting /login gets redirected to /
    if (isAuthenticated && isLoginPage) {
      return { action: "redirect", status: 307, redirectUrl: "/" };
    }

    // 3. Public endpoints
    if (isLoginPage || isPublicApiAuth) {
      return { action: "next", status: 200 };
    }

    // 4. Unauthenticated user
    if (!isAuthenticated) {
      if (pathname.startsWith("/api/")) {
        return {
          action: "unauthorized",
          status: 401,
          body: {
            success: false,
            message: "Chưa đăng nhập hoặc phiên làm việc đã hết hạn",
          },
        };
      }
      return { action: "redirect", status: 307, redirectUrl: "/login" };
    }

    return { action: "next", status: 200 };
  }

  // =========================================================================
  // 1. Token Generation, Cryptography & Tamper Detection
  // =========================================================================
  describe("1. Token Generation, Cryptography & Tamper Detection", () => {
    it("creates and verifies genuine session token using default/configured secret", async () => {
      const token = await createAuthToken();
      expect(typeof token).toBe("string");
      expect(token.includes(".")).toBe(true);

      const isValid = await verifyAuthToken(token);
      expect(isValid).toBe(true);
    });

    it("verifies custom timestamp session signing and verification", async () => {
      const now = Date.now();
      const token = await signSessionToken(now, ADMIN_SECRET);
      const isValid = await verifySessionToken(token, ADMIN_SECRET);
      expect(isValid).toBe(true);
    });

    it("rejects token when secret does not match (forged secret)", async () => {
      const now = Date.now();
      const token = await signSessionToken(now, "attacker-secret-key-666");
      const isValid = await verifySessionToken(token, ADMIN_SECRET);
      expect(isValid).toBe(false);
    });

    it("rejects expired token beyond maxAge (7 days)", async () => {
      const eightDaysAgo = Date.now() - (AUTH_COOKIE_MAX_AGE_MS + 100000);
      const token = await signSessionToken(eightDaysAgo, ADMIN_SECRET);
      const isValid = await verifySessionToken(token, ADMIN_SECRET);
      expect(isValid).toBe(false);
    });

    it("rejects token right at 1 millisecond past 7 days expiration threshold", async () => {
      const expiredMs = Date.now() - (AUTH_COOKIE_MAX_AGE_MS + 1);
      const token = await signSessionToken(expiredMs, ADMIN_SECRET);
      const isValid = await verifySessionToken(token, ADMIN_SECRET);
      expect(isValid).toBe(false);
    });

    it("accepts valid token 1 millisecond before expiration threshold", async () => {
      const validMs = Date.now() - (AUTH_COOKIE_MAX_AGE_MS - 2000);
      const token = await signSessionToken(validMs, ADMIN_SECRET);
      const isValid = await verifySessionToken(token, ADMIN_SECRET);
      expect(isValid).toBe(true);
    });

    it("accepts tokens within allowable 60s future clock skew", async () => {
      const thirtySecFuture = Date.now() + 30000;
      const token = await signSessionToken(thirtySecFuture, ADMIN_SECRET);
      const isValid = await verifySessionToken(token, ADMIN_SECRET);
      expect(isValid).toBe(true);
    });

    it("rejects tokens beyond 60s clock skew into future", async () => {
      const twoMinutesFuture = Date.now() + 120000;
      const token = await signSessionToken(twoMinutesFuture, ADMIN_SECRET);
      const isValid = await verifySessionToken(token, ADMIN_SECRET);
      expect(isValid).toBe(false);
    });

    it("rejects corrupted signature with flipped characters", async () => {
      const token = await createAuthToken();
      const [ts, sig] = token.split(".");
      const badSig = sig.slice(0, -1) + (sig.endsWith("0") ? "1" : "0");
      const isValid = await verifySessionToken(`${ts}.${badSig}`, ADMIN_SECRET);
      expect(isValid).toBe(false);
    });

    it("rejects malformed token formats (missing dot, empty strings, non-numeric timestamps)", async () => {
      const badTokens = [
        "",
        "   ",
        null,
        undefined,
        "no-dot-token",
        "abc.def",
        "-500.abcdef123456",
        "1234.56.abcdef",
        "1e10.abcdef",
        "NaN.abcdef",
        ".abcdef123456",
        "123456789.",
        "123.456.789",
      ];

      for (const t of badTokens) {
        const isValid = await verifySessionToken(t as any, ADMIN_SECRET);
        expect(isValid).toBe(false);
      }
    });
  });

  // =========================================================================
  // 2. Route Guard Protection: Unauthorized Page Requests
  // =========================================================================
  describe("2. Route Guard: Unauthorized Page Requests Redirect to /login", () => {
    it("redirects unauthenticated user from '/' to '/login'", async () => {
      const res = await simulateMiddleware("/", null);
      expect(res.action).toBe("redirect");
      expect(res.status).toBe(307);
      expect(res.redirectUrl).toBe("/login");
    });

    it("redirects unauthenticated user from '/rooms' to '/login'", async () => {
      const res = await simulateMiddleware("/rooms", undefined);
      expect(res.action).toBe("redirect");
      expect(res.status).toBe(307);
      expect(res.redirectUrl).toBe("/login");
    });

    it("redirects unauthenticated user from '/rooms/room-101' to '/login'", async () => {
      const res = await simulateMiddleware("/rooms/room-101", null);
      expect(res.action).toBe("redirect");
      expect(res.status).toBe(307);
      expect(res.redirectUrl).toBe("/login");
    });

    it("redirects unauthenticated user from deep nested routes '/rooms/101/edit' to '/login'", async () => {
      const res = await simulateMiddleware("/rooms/101/edit", "");
      expect(res.action).toBe("redirect");
      expect(res.status).toBe(307);
      expect(res.redirectUrl).toBe("/login");
    });

    it("redirects unauthenticated user from '/invoices/new' to '/login'", async () => {
      const res = await simulateMiddleware("/invoices/new", null);
      expect(res.action).toBe("redirect");
      expect(res.status).toBe(307);
      expect(res.redirectUrl).toBe("/login");
    });

    it("redirects unauthenticated user from '/settings' to '/login'", async () => {
      const res = await simulateMiddleware("/settings", "invalid-token-123");
      expect(res.action).toBe("redirect");
      expect(res.status).toBe(307);
      expect(res.redirectUrl).toBe("/login");
    });

    it("redirects unauthenticated user with URL search parameters (e.g. '/rooms?search=101&status=rented')", async () => {
      const res = await simulateMiddleware("/rooms?search=101&status=rented", null);
      expect(res.action).toBe("redirect");
      expect(res.status).toBe(307);
      expect(res.redirectUrl).toBe("/login");
    });

    it("redirects unauthenticated user with encoded URL characters (e.g. '/rooms/%E1%BB%9F%20tr%E1%BB%8D')", async () => {
      const res = await simulateMiddleware("/rooms/%E1%BB%9F%20tr%E1%BB%8D", null);
      expect(res.action).toBe("redirect");
      expect(res.status).toBe(307);
      expect(res.redirectUrl).toBe("/login");
    });

    it("redirects unauthenticated user from trailing slash routes (e.g. '/rooms/')", async () => {
      const res = await simulateMiddleware("/rooms/", null);
      expect(res.action).toBe("redirect");
      expect(res.status).toBe(307);
      expect(res.redirectUrl).toBe("/login");
    });
  });

  // =========================================================================
  // 3. Route Guard Protection: Unauthorized API Requests Receive 401
  // =========================================================================
  describe("3. Route Guard: Unauthorized API Requests Receive 401 Unauthorized", () => {
    it("returns 401 Unauthorized for unauthenticated GET '/api/rooms'", async () => {
      const res = await simulateMiddleware("/api/rooms", null);
      expect(res.action).toBe("unauthorized");
      expect(res.status).toBe(401);
      expect(res.body).toEqual({
        success: false,
        message: "Chưa đăng nhập hoặc phiên làm việc đã hết hạn",
      });
    });

    it("returns 401 Unauthorized for unauthenticated POST '/api/invoices'", async () => {
      const res = await simulateMiddleware("/api/invoices", undefined);
      expect(res.action).toBe("unauthorized");
      expect(res.status).toBe(401);
      expect(res.body?.success).toBe(false);
    });

    it("returns 401 Unauthorized for unauthenticated PUT '/api/settings'", async () => {
      const res = await simulateMiddleware("/api/settings", "");
      expect(res.action).toBe("unauthorized");
      expect(res.status).toBe(401);
    });

    it("returns 401 Unauthorized for unauthenticated API requests with search params (e.g. '/api/invoices?month=2026-08')", async () => {
      const res = await simulateMiddleware("/api/invoices?month=2026-08&room_id=123", null);
      expect(res.action).toBe("unauthorized");
      expect(res.status).toBe(401);
    });

    it("returns 401 Unauthorized for forged or expired token on API request", async () => {
      const expiredMs = Date.now() - (AUTH_COOKIE_MAX_AGE_MS + 50000);
      const expiredToken = await signSessionToken(expiredMs, ADMIN_SECRET);

      const res = await simulateMiddleware("/api/rooms", expiredToken);
      expect(res.action).toBe("unauthorized");
      expect(res.status).toBe(401);
    });
  });

  // =========================================================================
  // 4. Public Endpoints & Login Flow
  // =========================================================================
  describe("4. Public Endpoints & Login Flow", () => {
    it("allows unauthenticated user to access '/login' page", async () => {
      const res = await simulateMiddleware("/login", null);
      expect(res.action).toBe("next");
      expect(res.status).toBe(200);
    });

    it("allows unauthenticated user to access '/login?redirect=%2Frooms' with search params", async () => {
      const res = await simulateMiddleware("/login?redirect=%2Frooms", null);
      expect(res.action).toBe("next");
    });

    it("allows unauthenticated user to call POST '/api/auth/login'", async () => {
      const res = await simulateMiddleware("/api/auth/login", null);
      expect(res.action).toBe("next");
    });

    it("allows unauthenticated user to call POST/GET '/api/auth/logout'", async () => {
      const res = await simulateMiddleware("/api/auth/logout", null);
      expect(res.action).toBe("next");
    });

    it("redirects authenticated user visiting '/login' back to dashboard '/'", async () => {
      const token = await createAuthToken();
      const res = await simulateMiddleware("/login", token);
      expect(res.action).toBe("redirect");
      expect(res.status).toBe(307);
      expect(res.redirectUrl).toBe("/");
    });

    it("redirects authenticated user visiting '/login?ref=123' back to dashboard '/'", async () => {
      const token = await createAuthToken();
      const res = await simulateMiddleware("/login?ref=123", token);
      expect(res.action).toBe("redirect");
      expect(res.redirectUrl).toBe("/");
    });
  });

  // =========================================================================
  // 5. Authenticated Access to Protected Routes
  // =========================================================================
  describe("5. Authenticated Access to Protected Routes", () => {
    it("allows authenticated user to access all protected pages and APIs", async () => {
      const token = await createAuthToken();
      const routes = [
        "/",
        "/rooms",
        "/rooms/room-101",
        "/rooms/101/edit",
        "/invoices/new",
        "/invoices/new?month=2026-08",
        "/settings",
        "/api/rooms",
        "/api/invoices",
        "/api/settings",
      ];

      for (const route of routes) {
        const res = await simulateMiddleware(route, token);
        expect(res.action).toBe("next");
        expect(res.status).toBe(200);
      }
    });
  });

  // =========================================================================
  // 6. Static Asset & Internal File Exclusion
  // =========================================================================
  describe("6. Static Asset Exclusion Rules", () => {
    it("allows access to static assets without authentication", async () => {
      const staticPaths = [
        "/_next/static/chunks/main.js",
        "/_next/static/css/app.css",
        "/_next/image?url=%2Flogo.png&w=64&q=75",
        "/static/images/hero.jpg",
        "/favicon.ico",
        "/icon.png",
        "/manifest.json",
        "/robots.txt",
        "/logo.svg",
      ];

      for (const path of staticPaths) {
        const res = await simulateMiddleware(path, null);
        expect(res.action).toBe("next");
      }
    });
  });

  // =========================================================================
  // 7. High Concurrency & Multi-Request Stress Harness
  // =========================================================================
  describe("7. High Concurrency & Multi-Request Stress Harness", () => {
    it("handles 100 concurrent route-guard checks without race conditions or state pollution", async () => {
      const validToken = await createAuthToken();
      const requests = Array.from({ length: 100 }, (_, i) => {
        const isAuth = i % 2 === 0;
        const isApi = i % 3 === 0;
        const path = isApi ? `/api/test-${i}` : `/page-${i}`;
        const token = isAuth ? validToken : null;
        return simulateMiddleware(path, token).then((res) => ({
          i,
          isAuth,
          isApi,
          res,
        }));
      });

      const results = await Promise.all(requests);
      expect(results).toHaveLength(100);

      for (const { isAuth, isApi, res } of results) {
        if (isAuth) {
          expect(res.action).toBe("next");
        } else if (isApi) {
          expect(res.action).toBe("unauthorized");
          expect(res.status).toBe(401);
        } else {
          expect(res.action).toBe("redirect");
          expect(res.redirectUrl).toBe("/login");
        }
      }
    });
  });
});
