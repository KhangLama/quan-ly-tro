import { describe, it, expect } from "vitest";
import {
  AUTH_COOKIE_NAME,
  AUTH_COOKIE_MAX_AGE,
  AUTH_COOKIE_OPTIONS,
  DEFAULT_ADMIN_PASSWORD,
  getAdminPassword,
} from "../../src/lib/auth/constants.ts";
import {
  signSessionToken,
  verifySessionToken,
  createAuthToken,
  verifyAuthToken,
} from "../../src/lib/auth/session.ts";

describe("Milestone 2: UI Primitives & Auth Components Integrity", () => {
  describe("Auth Configuration & Constants", () => {
    it("has correct auth cookie name 'auth_session'", () => {
      expect(AUTH_COOKIE_NAME).toBe("auth_session");
    });

    it("has standard 7-day cookie maxAge", () => {
      expect(AUTH_COOKIE_MAX_AGE).toBe(7 * 24 * 60 * 60);
    });

    it("configures httpOnly, sameSite, path cookie options securely", () => {
      expect(AUTH_COOKIE_OPTIONS.httpOnly).toBe(true);
      expect(AUTH_COOKIE_OPTIONS.sameSite).toBe("lax");
      expect(AUTH_COOKIE_OPTIONS.path).toBe("/");
    });

    it("falls back to default admin password when env is not set", () => {
      expect(DEFAULT_ADMIN_PASSWORD).toBe("tro123456");
      expect(getAdminPassword()).toBeDefined();
    });
  });

  describe("Session HMAC Cryptography", () => {
    it("signs and verifies tokens using Web Crypto HMAC-SHA256", async () => {
      const token = await createAuthToken();
      expect(typeof token).toBe("string");
      const [ts, sig] = token.split(".");
      expect(parseInt(ts, 10)).toBeGreaterThan(0);
      expect(sig.length).toBe(64); // SHA-256 hex string is 64 chars

      const valid = await verifyAuthToken(token);
      expect(valid).toBe(true);
    });

    it("rejects token with corrupted hex signature", async () => {
      const token = await createAuthToken();
      const [ts, sig] = token.split(".");
      const corruptedSig = sig.slice(0, -1) + (sig.endsWith("0") ? "1" : "0");
      const badToken = `${ts}.${corruptedSig}`;
      const valid = await verifyAuthToken(badToken);
      expect(valid).toBe(false);
    });
  });
});
