import { VIETNAMESE_BANKS, type BankInfo } from "./constants/banks.ts";

export interface BankAccountConfig {
  bank: string;
  accountNumber: string;
  accountName: string;
}

export interface PaymentAccountsConfig {
  split: boolean; // false: single unified account, true: separate room & utilities
  room: BankAccountConfig;
  service: BankAccountConfig;
}

/**
 * Remove Vietnamese accents to ensure 100% compatibility with all banking apps transfer syntax
 */
export function removeVietnameseAccents(str: string): string {
  if (!str) return "";
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .replace(/[^a-zA-Z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Get friendly display name for a bank code (e.g. "MB" -> "MBBank")
 */
export function getBankDisplayName(bankCode: string): string {
  if (!bankCode) return "";
  const found = VIETNAMESE_BANKS.find(
    (b) => b.code.toUpperCase() === bankCode.trim().toUpperCase()
  );
  return found ? found.shortName : bankCode.trim().toUpperCase();
}

/**
 * Parse raw bank_info string into structured PaymentAccountsConfig
 * Handles both legacy plain-text format ("MB - 0987654321 - NGUYEN VAN A")
 * and modern JSON configuration format.
 */
export function parsePaymentAccounts(raw?: string | null): PaymentAccountsConfig {
  const defaultConfig: PaymentAccountsConfig = {
    split: false,
    room: {
      bank: "MB",
      accountNumber: "",
      accountName: "",
    },
    service: {
      bank: "MB",
      accountNumber: "",
      accountName: "",
    },
  };

  if (!raw || !raw.trim()) {
    return defaultConfig;
  }

  const trimmed = raw.trim();

  // If stored as JSON configuration
  if (trimmed.startsWith("{")) {
    try {
      const parsed = JSON.parse(trimmed);
      return {
        split: Boolean(parsed.split),
        room: {
          bank: parsed.room?.bank || "MB",
          accountNumber: parsed.room?.accountNumber || "",
          accountName: parsed.room?.accountName || "",
        },
        service: {
          bank: parsed.service?.bank || parsed.room?.bank || "MB",
          accountNumber: parsed.service?.accountNumber || "",
          accountName: parsed.service?.accountName || "",
        },
      };
    } catch {
      // Fallback to legacy parser if JSON fails
    }
  }

  // Parse legacy string e.g. "MB Bank - 0987654321 - NGUYEN VAN A"
  const parts = trimmed.split("-").map((p) => p.trim());
  let bank = "MB";
  let accountNumber = "";
  let accountName = "";

  if (parts.length >= 3) {
    // Check if parts[0] matches a known bank
    const matchedBank = VIETNAMESE_BANKS.find(
      (b) =>
        b.code.toUpperCase() === parts[0].toUpperCase() ||
        parts[0].toUpperCase().includes(b.shortName.toUpperCase()) ||
        b.shortName.toUpperCase().includes(parts[0].toUpperCase())
    );
    bank = matchedBank ? matchedBank.code : parts[0];
    accountNumber = parts[1];
    accountName = parts.slice(2).join("-").trim();
  } else if (parts.length === 2) {
    bank = parts[0];
    accountNumber = parts[1];
  } else {
    accountNumber = trimmed;
  }

  return {
    split: false,
    room: {
      bank,
      accountNumber,
      accountName,
    },
    service: {
      bank,
      accountNumber,
      accountName,
    },
  };
}

/**
 * Serialize PaymentAccountsConfig into a storage string
 */
export function serializePaymentAccounts(config: PaymentAccountsConfig): string {
  if (!config.split) {
    // If not split, store in friendly human-readable format for backward compatibility
    const bankName = config.room.bank || "MB";
    const accNum = config.room.accountNumber ? ` - ${config.room.accountNumber}` : "";
    const accOwner = config.room.accountName ? ` - ${config.room.accountName.toUpperCase()}` : "";
    return `${bankName}${accNum}${accOwner}`;
  }

  // If split, serialize as JSON to retain all dual account fields
  return JSON.stringify({
    split: true,
    room: {
      bank: config.room.bank,
      accountNumber: config.room.accountNumber,
      accountName: config.room.accountName.toUpperCase(),
    },
    service: {
      bank: config.service.bank,
      accountNumber: config.service.accountNumber,
      accountName: config.service.accountName.toUpperCase(),
    },
  });
}

export interface VietQRParams {
  bankCode: string;
  accountNumber: string;
  accountName?: string;
  amount: number;
  description?: string;
}

/**
 * Builds standard Napas VietQR image URL from img.vietqr.io
 */
export function buildVietQRUrl({
  bankCode,
  accountNumber,
  accountName,
  amount,
  description,
}: VietQRParams): string {
  const cleanBank = (bankCode || "MB").trim().toUpperCase();
  const cleanAccount = (accountNumber || "").replace(/[^a-zA-Z0-9]/g, "");
  const cleanAmount = Math.max(0, Math.round(amount || 0));
  const unaccentedDesc = description ? removeVietnameseAccents(description) : "";
  const encodedDesc = unaccentedDesc ? encodeURIComponent(unaccentedDesc) : "";
  const cleanName = accountName ? encodeURIComponent(removeVietnameseAccents(accountName).toUpperCase()) : "";

  let url = `https://img.vietqr.io/image/${cleanBank}-${cleanAccount}-qr_only.png?amount=${cleanAmount}`;
  if (encodedDesc) {
    url += `&addInfo=${encodedDesc}`;
  }
  if (cleanName) {
    url += `&accountName=${cleanName}`;
  }
  return url;
}
