import { describe, it, expect, vi, beforeEach } from "vitest";
import { signSessionToken, verifySessionToken } from "../fixtures/seed-data.ts";

// Mock Supabase server client so unit tests NEVER read/write real production DB
const mockDbState: {
  admin_password_hash: string | null;
  service_description: string | null;
  shouldFailUpdate: boolean;
} = {
  admin_password_hash: null,
  service_description: null,
  shouldFailUpdate: false,
};

vi.mock("../../src/lib/supabase/server.ts", () => ({
  createClient: vi.fn(async () => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(async () => ({
            data: {
              id: 1,
              admin_password_hash: mockDbState.admin_password_hash,
              service_description: mockDbState.service_description,
            },
            error: null,
          })),
        })),
      })),
      update: vi.fn((payload: Record<string, unknown>) => ({
        eq: vi.fn(async () => {
          if (mockDbState.shouldFailUpdate) {
            return {
              data: null,
              error: { message: "Mock DB write failure" },
            };
          }
          if (typeof payload.admin_password_hash === "string") {
            mockDbState.admin_password_hash = payload.admin_password_hash;
          }
          if (typeof payload.service_description === "string") {
            mockDbState.service_description = payload.service_description;
          }
          return { data: null, error: null };
        }),
      })),
    })),
  })),
}));

import {
  AUTH_HASH_PREFIX,
  hashAdminPassword,
  verifyAdminPassword,
} from "../../src/lib/auth/password.ts";
import { getAdminPassword } from "../../src/lib/auth/constants.ts";
import { changeAdminPassword } from "../../src/actions/auth.ts";

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

describe("Unit Test: Admin Password Hashing, Verification & Change Flow (Mocked DB)", () => {
  beforeEach(() => {
    mockDbState.admin_password_hash = null;
    mockDbState.service_description = null;
    mockDbState.shouldFailUpdate = false;
  });

  it("hashAdminPassword generates a deterministic 64-character hex SHA-256 hash and trims whitespace", async () => {
    const hash1 = await hashAdminPassword("mat-khau-moi-2026");
    const hash2 = await hashAdminPassword("  mat-khau-moi-2026  ");
    const hashDifferent = await hashAdminPassword("mat-khau-khac-2026");

    expect(hash1).toMatch(/^[a-f0-9]{64}$/);
    expect(hash1).toBe(hash2);
    expect(hash1).not.toBe(hashDifferent);
  });

  it("verifyAdminPassword falls back to default/env admin password when no hash is stored in DB", async () => {
    const defaultPw = getAdminPassword();
    expect(await verifyAdminPassword(defaultPw)).toBe(true);
    expect(await verifyAdminPassword(`  ${defaultPw}  `)).toBe(true);
    expect(await verifyAdminPassword("wrong-password-xyz")).toBe(false);
    expect(await verifyAdminPassword("")).toBe(false);
  });

  it("verifyAdminPassword validates against stored admin_password_hash or fallback service_description prefix", async () => {
    const customHash = await hashAdminPassword("custom-secret-888");
    mockDbState.admin_password_hash = customHash;

    expect(await verifyAdminPassword("custom-secret-888")).toBe(true);
    expect(await verifyAdminPassword(getAdminPassword())).toBe(false);

    // Fallback via service_description prefix when admin_password_hash is null
    mockDbState.admin_password_hash = null;
    mockDbState.service_description = `${AUTH_HASH_PREFIX}${customHash}`;
    expect(await verifyAdminPassword("custom-secret-888")).toBe(true);
  });

  it("changeAdminPassword validates empty fields, minimum length, confirm mismatch, wrong current password, and duplicate password", async () => {
    const currentPw = getAdminPassword();

    const emptyCurrent = await changeAdminPassword("   ", "newpass123", "newpass123");
    expect(emptyCurrent).toEqual({
      success: false,
      error: "Vui lòng nhập mật khẩu hiện tại",
    });

    const emptyNew = await changeAdminPassword(currentPw, "   ", "   ");
    expect(emptyNew).toEqual({
      success: false,
      error: "Vui lòng nhập mật khẩu mới",
    });

    const shortNew = await changeAdminPassword(currentPw, "12345", "12345");
    expect(shortNew).toEqual({
      success: false,
      error: "Mật khẩu mới phải có ít nhất 6 ký tự",
    });

    const mismatchConfirm = await changeAdminPassword(currentPw, "newpass123", "newpass999");
    expect(mismatchConfirm).toEqual({
      success: false,
      error: "Mật khẩu xác nhận không khớp",
    });

    const wrongCurrent = await changeAdminPassword("wrong-old-pass", "newpass123", "newpass123");
    expect(wrongCurrent).toEqual({
      success: false,
      error: "Mật khẩu hiện tại không chính xác",
    });

    const samePassword = await changeAdminPassword(currentPw, currentPw, currentPw);
    expect(samePassword).toEqual({
      success: false,
      error: "Mật khẩu mới phải khác mật khẩu hiện tại",
    });
  });

  it("changeAdminPassword hashes and saves new password in mocked state without touching real DB", async () => {
    const currentPw = getAdminPassword();
    const newPw = "bong-gon-qa-2026";

    const res = await changeAdminPassword(currentPw, newPw, newPw);
    expect(res.success).toBe(true);
    expect(res.message).toBe("Đổi mật khẩu quản trị viên thành công!");

    const expectedHash = await hashAdminPassword(newPw);
    expect(mockDbState.admin_password_hash).toBe(expectedHash);

    // Subsequent verification uses the new password hash
    expect(await verifyAdminPassword(newPw)).toBe(true);
    expect(await verifyAdminPassword(currentPw)).toBe(false);
  });
});

