import { createClient } from "../supabase/server.ts";
import { getAdminPassword } from "./constants.ts";

export const AUTH_HASH_PREFIX = "__AUTH_SHA256__:";

/**
 * Băm mật khẩu quản trị viên bằng SHA-256 (Web Crypto API) kèm salt cố định của hệ thống.
 * Trả về chuỗi hex 64 ký tự.
 */
export async function hashAdminPassword(password: string): Promise<string> {
  const normalized = (password || "").trim();
  const data = new TextEncoder().encode(`quan-ly-tro-admin-v1:${normalized}`);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Truy vấn mã băm mật khẩu quản trị viên đã lưu trong bảng `settings` (id = 1).
 * Ưu tiên cột `admin_password_hash`, fallback sang tiền tố `__AUTH_SHA256__:` trong `service_description`
 * nếu database chưa chạy migration thêm cột mới.
 */
export async function getStoredAdminPasswordHash(): Promise<string | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("settings")
      .select("*")
      .eq("id", 1)
      .single();

    if (error || !data) {
      return null;
    }

    const explicitHash = (data as any)?.admin_password_hash;
    if (typeof explicitHash === "string" && explicitHash.trim().length === 64) {
      return explicitHash.trim();
    }

    const serviceDesc = (data as any)?.service_description;
    if (
      typeof serviceDesc === "string" &&
      serviceDesc.startsWith(AUTH_HASH_PREFIX)
    ) {
      const extracted = serviceDesc
        .slice(AUTH_HASH_PREFIX.length)
        .trim()
        .slice(0, 64);
      if (/^[a-f0-9]{64}$/i.test(extracted)) {
        return extracted.toLowerCase();
      }
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Kiểm tra mật khẩu người dùng nhập vào:
 * - Nếu đã có hash lưu trên Supabase `settings`: so sánh SHA-256 hash.
 * - Nếu chưa từng đổi mật khẩu trên DB (`storedHash === null`): so sánh với `getAdminPassword()` mặc định / biến môi trường.
 */
export async function verifyAdminPassword(
  inputPassword: string
): Promise<boolean> {
  if (!inputPassword || typeof inputPassword !== "string") {
    return false;
  }

  const storedHash = await getStoredAdminPasswordHash();
  if (storedHash) {
    const inputHash = await hashAdminPassword(inputPassword);
    return inputHash === storedHash;
  }

  return inputPassword.trim() === getAdminPassword().trim();
}

/**
 * Lưu mã băm mật khẩu quản trị viên mới vào bảng `settings` (id = 1) trên Supabase.
 * Tự động fallback sang `service_description` nếu bảng `settings` chưa có cột `admin_password_hash`.
 */
export async function saveAdminPasswordHash(
  newHash: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const nowIso = new Date().toISOString();

    const { error } = await supabase
      .from("settings")
      .update({
        admin_password_hash: newHash,
        updated_at: nowIso,
      } as any)
      .eq("id", 1);

    if (
      error &&
      (error.code === "PGRST204" ||
        error.message?.includes("admin_password_hash") ||
        error.message?.includes("Could not find"))
    ) {
      const fallbackRes = await supabase
        .from("settings")
        .update({
          service_description: `${AUTH_HASH_PREFIX}${newHash}`,
          updated_at: nowIso,
        })
        .eq("id", 1);

      if (fallbackRes.error) {
        return {
          success: false,
          error: fallbackRes.error.message || "Không thể lưu mật khẩu mới",
        };
      }
      return { success: true };
    }

    if (error) {
      return {
        success: false,
        error: error.message || "Lỗi khi lưu mật khẩu mới vào cơ sở dữ liệu",
      };
    }

    return { success: true };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || "Lỗi kết nối cơ sở dữ liệu khi đổi mật khẩu",
    };
  }
}
