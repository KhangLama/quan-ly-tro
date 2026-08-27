import { describe, it, expect, vi } from "vitest";
import { signSessionToken, verifySessionToken } from "../fixtures/seed-data.ts";

describe("Unit Test: Web Crypto HMAC-SHA256 Auth Session Token", () => {
  const SECRET = "super-secret-admin-key-2026";

  it("signs and verifies a valid session token successfully", async () => {
    const now = Date.now();
    const token = await signSessionToken(now, SECRET);

    expect(typeof token).toBe("string");
    expect(token.includes(".")).toBe(true);

    const isValid = await verifySessionToken(token, SECRET);
    expect(isValid).toBe(true);
  });

  it("rejects token signed with a different secret key", async () => {
    const now = Date.now();
    const token = await signSessionToken(now, "wrong-password-123");

    const isValid = await verifySessionToken(token, SECRET);
    expect(isValid).toBe(false);
  });

  it("detects and rejects tampered timestamp in token payload", async () => {
    const now = Date.now();
    const token = await signSessionToken(now, SECRET);
    const [, signature] = token.split(".");

    // Alter timestamp by 1000ms
    const tamperedToken = `${now + 1000}.${signature}`;
    const isValid = await verifySessionToken(tamperedToken, SECRET);
    expect(isValid).toBe(false);
  });

  it("detects and rejects tampered signature bits", async () => {
    const now = Date.now();
    const token = await signSessionToken(now, SECRET);
    const [timestamp, signature] = token.split(".");

    // Flip last character of hex signature
    const corruptedSignature = signature.slice(0, -1) + (signature.endsWith("a") ? "b" : "a");
    const tamperedToken = `${timestamp}.${corruptedSignature}`;

    const isValid = await verifySessionToken(tamperedToken, SECRET);
    expect(isValid).toBe(false);
  });

  it("rejects expired tokens older than the allowed maxAge threshold", async () => {
    const eightDaysAgo = Date.now() - 8 * 24 * 60 * 60 * 1000;
    const token = await signSessionToken(eightDaysAgo, SECRET);

    // Default maxAge is 7 days
    const isValid = await verifySessionToken(token, SECRET, 7 * 24 * 60 * 60 * 1000);
    expect(isValid).toBe(false);
  });

  it("rejects future timestamps that exceed maximum acceptable clock skew", async () => {
    const twoHoursInFuture = Date.now() + 2 * 60 * 60 * 1000;
    const token = await signSessionToken(twoHoursInFuture, SECRET);

    const isValid = await verifySessionToken(token, SECRET);
    expect(isValid).toBe(false);
  });

  it("handles empty, null, undefined, and non-token malformed strings safely", async () => {
    expect(await verifySessionToken(null, SECRET)).toBe(false);
    expect(await verifySessionToken(undefined, SECRET)).toBe(false);
    expect(await verifySessionToken("", SECRET)).toBe(false);
    expect(await verifySessionToken("random-string-no-dot", SECRET)).toBe(false);
    expect(await verifySessionToken("abc.def.ghi", SECRET)).toBe(false);
    expect(await verifySessionToken("not-a-number.signature", SECRET)).toBe(false);
  });
});
