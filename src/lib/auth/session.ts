import {
  AUTH_COOKIE_NAME,
  AUTH_COOKIE_MAX_AGE_MS,
  getAdminPassword,
} from "./constants.ts";

export { AUTH_COOKIE_NAME };

/**
 * Signs a timestamp with secret key using HMAC-SHA256 (Web Crypto API)
 */
export async function signSessionToken(
  timestamp: number,
  secret: string
): Promise<string> {
  const enc = new TextEncoder();
  const keyData = enc.encode(secret);
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signatureBuffer = await crypto.subtle.sign(
    "HMAC",
    cryptoKey,
    enc.encode(timestamp.toString())
  );
  const signatureHex = Array.from(new Uint8Array(signatureBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return `${timestamp}.${signatureHex}`;
}

/**
 * Verifies that the token was signed with the given secret and has not expired
 */
export async function verifySessionToken(
  token: string | null | undefined,
  secret: string,
  maxAgeMs = AUTH_COOKIE_MAX_AGE_MS
): Promise<boolean> {
  if (!token || typeof token !== "string") return false;
  const parts = token.split(".");
  if (parts.length !== 2) return false;

  const [tsStr, signatureHex] = parts;
  if (!/^\d+$/.test(tsStr)) return false;

  const ts = parseInt(tsStr, 10);
  if (isNaN(ts)) return false;

  const now = Date.now();
  if (now - ts > maxAgeMs || ts > now + 60000) {
    return false; // Expired or future timestamp beyond 1 min clock skew
  }

  try {
    const expectedToken = await signSessionToken(ts, secret);
    return token === expectedToken;
  } catch {
    return false;
  }
}

/**
 * Creates a signed token using system ADMIN_PASSWORD
 */
export async function createAuthToken(): Promise<string> {
  const secret = getAdminPassword();
  return signSessionToken(Date.now(), secret);
}

/**
 * Verifies a token using system ADMIN_PASSWORD
 */
export async function verifyAuthToken(
  token: string | null | undefined
): Promise<boolean> {
  const secret = getAdminPassword();
  return verifySessionToken(token, secret);
}
