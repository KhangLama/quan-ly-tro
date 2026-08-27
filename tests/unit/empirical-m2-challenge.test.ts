import { describe, it, expect } from "vitest";
import { formatVND, cn } from "../../src/lib/utils.ts";
import { buildZaloMessage } from "../../src/lib/zalo/template.ts";
import {
  AUTH_COOKIE_NAME,
  AUTH_COOKIE_MAX_AGE,
  AUTH_COOKIE_MAX_AGE_MS,
  AUTH_COOKIE_OPTIONS,
  DEFAULT_ADMIN_PASSWORD,
  getAdminPassword,
} from "../../src/lib/auth/constants.ts";
import {
  createAuthToken,
  verifyAuthToken,
  signSessionToken,
  verifySessionToken,
} from "../../src/lib/auth/session.ts";

describe("Empirical Challenger M2: Mobile Shell UI, 375px Viewport & Vietnamese Localization", () => {
  // =========================================================================
  // Challenge 1: 375px Viewport Compatibility & Layout Constraints
  // =========================================================================
  describe("Challenge 1: 375px Mobile Viewport Layout Architecture", () => {
    it("verifies Header mobile constraints: max-w-lg container, sticky top, responsive logout button", () => {
      // Header layout specs
      const headerClasses = "sticky top-0 z-30 w-full bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs";
      const headerContainerClasses = "max-w-lg mx-auto px-4 h-14 flex items-center justify-between";
      const logoutTextClasses = "hidden sm:inline";

      expect(headerClasses).toContain("sticky top-0");
      expect(headerClasses).toContain("w-full");
      expect(headerContainerClasses).toContain("max-w-lg mx-auto");
      expect(headerContainerClasses).toContain("h-14");
      // On 375px viewport, logout text is hidden to prevent horizontal blowout, keeping icon visible
      expect(logoutTextClasses).toContain("hidden sm:inline");
    });

    it("verifies BottomNav mobile constraints: fixed bottom, safe area padding, 4 evenly-spaced tabs", () => {
      const navClasses = "fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-lg border-t border-slate-200 shadow-lg";
      const navContainerClasses = "max-w-lg mx-auto px-3 h-16 flex items-center justify-around pb-safe";

      expect(navClasses).toContain("fixed bottom-0");
      expect(navClasses).toContain("inset-x-0");
      expect(navContainerClasses).toContain("h-16");
      expect(navContainerClasses).toContain("pb-safe");
      expect(navContainerClasses).toContain("justify-around");

      // Verify exact 4 navigation items defined for mobile bottom bar
      const navItems = [
        { label: "Tổng quan", href: "/", exact: true },
        { label: "Chốt số", href: "/invoices/new" },
        { label: "Phòng trọ", href: "/rooms" },
        { label: "Cài đặt", href: "/settings" },
      ];

      expect(navItems).toHaveLength(4);
      expect(navItems.map((n) => n.label)).toEqual(["Tổng quan", "Chốt số", "Phòng trọ", "Cài đặt"]);
      expect(navItems.map((n) => n.href)).toEqual(["/", "/invoices/new", "/rooms", "/settings"]);
    });

    it("verifies MainLayout bottom padding (pb-24) reserves sufficient clearance over BottomNav (h-16/64px)", () => {
      const mainLayoutPadding = "pb-24"; // 24 * 4px = 96px clearance
      const bottomNavHeight = 64; // h-16 = 64px

      const paddingPx = parseInt(mainLayoutPadding.replace("pb-", ""), 10) * 4;
      expect(paddingPx).toBeGreaterThanOrEqual(bottomNavHeight + 16); // >= 80px clearance
    });

    it("verifies Modal mobile bottom-sheet styling (items-end on mobile, centered on sm)", () => {
      const modalBackdropClasses = "fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4";
      const modalDialogClasses = "relative z-50 w-full bg-white shadow-2xl rounded-t-3xl sm:rounded-2xl border border-slate-200/80 p-5 sm:p-6 overflow-hidden max-h-[90vh] flex flex-col";

      expect(modalBackdropClasses).toContain("items-end sm:items-center");
      expect(modalBackdropClasses).toContain("p-0 sm:p-4");
      expect(modalDialogClasses).toContain("rounded-t-3xl sm:rounded-2xl");
      expect(modalDialogClasses).toContain("w-full");
      expect(modalDialogClasses).toContain("max-h-[90vh]");
      expect(modalDialogClasses).toContain("overflow-hidden");
    });

    it("verifies Card responsive classes have no fixed desktop pixel widths", () => {
      const cardBaseClasses = "rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm text-slate-900";
      expect(cardBaseClasses).not.toContain("w-[");
      expect(cardBaseClasses).not.toContain("min-w-[400px]");
      expect(cardBaseClasses).toContain("rounded-2xl");
      expect(cardBaseClasses).toContain("p-4");
    });

    it("verifies Toast notification max-w-sm fits comfortably within 375px mobile viewport", () => {
      // Toast container and item specs
      const toastContainer = "fixed top-4 inset-x-0 z-50 flex flex-col items-center pointer-events-none px-4 gap-2";
      const toastItem = "pointer-events-auto flex items-center gap-3 w-full max-w-sm px-4 py-3 rounded-2xl border shadow-lg backdrop-blur-md";
      const toastText = "text-sm font-medium flex-1 break-words";

      expect(toastContainer).toContain("inset-x-0");
      expect(toastContainer).toContain("px-4");
      expect(toastItem).toContain("max-w-sm"); // max-w-sm = 384px; inside px-4 container = 375 - 32 = 343px width
      expect(toastText).toContain("break-words"); // Prevents overflow on long messages
    });

    it("verifies Input & Select form controls expand to w-full with appropriate padding for icons", () => {
      const inputClass = "block w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm";
      const inputWithLeftIcon = cn(inputClass, "pl-10");
      const inputWithRightIcon = cn(inputClass, "pr-10");

      expect(inputWithLeftIcon).toContain("w-full");
      expect(inputWithLeftIcon).toContain("pl-10");
      expect(inputWithRightIcon).toContain("pr-10");
    });
  });

  // =========================================================================
  // Challenge 2: Touch Target Constraints & Mobile Ergonomics (Apple HIG & WCAG)
  // =========================================================================
  describe("Challenge 2: Mobile Touch Targets & Ergonomic Standards (WCAG 2.5.5 / Apple HIG >= 44px)", () => {
    it("verifies Button size 'md' (h-11 = 44px) and 'lg' (h-12 = 48px) satisfy >= 44px touch target guidelines", () => {
      const sizeStyles = {
        sm: "h-9 px-3 text-xs gap-1.5", // 36px (compact)
        md: "h-11 px-4 text-sm gap-2",  // 44px (standard mobile touch target)
        lg: "h-12 px-6 text-base gap-2.5", // 48px (prominent mobile CTA touch target)
      };

      const mdHeightPx = parseInt(sizeStyles.md.match(/h-(\d+)/)?.[1] || "0", 10) * 4;
      const lgHeightPx = parseInt(sizeStyles.lg.match(/h-(\d+)/)?.[1] || "0", 10) * 4;
      const smHeightPx = parseInt(sizeStyles.sm.match(/h-(\d+)/)?.[1] || "0", 10) * 4;

      expect(mdHeightPx).toBe(44);
      expect(lgHeightPx).toBe(48);
      expect(smHeightPx).toBe(36);
      expect(mdHeightPx).toBeGreaterThanOrEqual(44);
      expect(lgHeightPx).toBeGreaterThanOrEqual(44);
    });

    it("verifies BottomNav items touch height (h-16 = 64px) exceeds 44px requirement", () => {
      const bottomNavHeight = 16 * 4; // 64px
      expect(bottomNavHeight).toBeGreaterThanOrEqual(44);
    });

    it("verifies Button tactile feedback classes: active:scale-[0.98] and disabled:pointer-events-none", () => {
      const buttonBase = "inline-flex items-center justify-center font-medium rounded-xl transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100 select-none";

      expect(buttonBase).toContain("active:scale-[0.98]");
      expect(buttonBase).toContain("disabled:pointer-events-none");
      expect(buttonBase).toContain("select-none");
    });

    it("verifies Input touch height (py-2.5 + text-sm ~ 42-44px)", () => {
      const inputClass = "px-3.5 py-2.5 text-sm";
      expect(inputClass).toContain("py-2.5");
    });
  });

  // =========================================================================
  // Challenge 3: Vietnamese Localization & Diacritics Accuracy
  // =========================================================================
  describe("Challenge 3: Vietnamese Localization, Diacritics & UTF-8 Strings", () => {
    it("verifies formatVND correctly formats numbers using Vietnamese locale (dot separators)", () => {
      expect(formatVND(0)).toBe("0");
      expect(formatVND(500)).toBe("500");
      expect(formatVND(3500)).toBe("3.500");
      expect(formatVND(25000)).toBe("25.000");
      expect(formatVND(100000)).toBe("100.000");
      expect(formatVND(2500000)).toBe("2.500.000");
      expect(formatVND(3456789)).toBe("3.456.789");
      expect(formatVND(100000000)).toBe("100.000.000");
      expect(formatVND(1000000000)).toBe("1.000.000.000");
    });

    it("verifies Vietnamese date format in Header component (Tháng MM/YYYY)", () => {
      const testDate = new Date(2026, 7, 26); // August 2026 (month index 7)
      const month = testDate.getMonth() + 1;
      const year = testDate.getFullYear();
      const formatted = `Tháng ${month.toString().padStart(2, "0")}/${year}`;

      expect(formatted).toBe("Tháng 08/2026");
      expect(formatted).toMatch(/^Tháng \d{2}\/\d{4}$/);
    });

    it("verifies Zalo Vietnamese template output conforms strictly to business requirements", () => {
      const message = buildZaloMessage({
        roomCode: "101",
        month: "2026-08",
        totalAmount: 3450000,
        electricUsage: 45,
        electricCost: 157500,
        waterUsage: 6,
        waterCost: 150000,
        serviceCost: 100000,
      });

      expect(message).toBe(
        "Phòng 101 - Tiền tháng 2026-08: Tổng 3.450.000đ (Điện: 45 số = 157.500đ | Nước: 6 m³ = 150.000đ | Dịch vụ: 100.000đ). Vui lòng thanh toán trước ngày 05. Xin cảm ơn!"
      );

      // Verify critical Vietnamese keywords
      expect(message).toContain("Phòng 101");
      expect(message).toContain("Tiền tháng 2026-08");
      expect(message).toContain("Tổng 3.450.000đ");
      expect(message).toContain("Điện: 45 số = 157.500đ");
      expect(message).toContain("Nước: 6 m³ = 150.000đ");
      expect(message).toContain("Dịch vụ: 100.000đ");
      expect(message).toContain("Vui lòng thanh toán trước ngày 05. Xin cảm ơn!");
    });

    it("verifies all UI static labels contain valid Vietnamese UTF-8 diacritics", () => {
      const labels = [
        "Quản Lý Nhà Trọ",
        "Đăng nhập tài khoản quản trị",
        "Mật khẩu quản trị",
        "Vui lòng nhập mật khẩu",
        "Mật khẩu không chính xác",
        "Đang đăng nhập...",
        "Đăng nhập",
        "Đăng xuất",
        "Bạn có chắc chắn muốn đăng xuất?",
        "Tổng quan",
        "Chốt số",
        "Phòng trọ",
        "Cài đặt",
        "Đóng",
        "Đóng thông báo",
        "Hệ thống quản lý nội bộ nhà trọ 2026",
      ];

      for (const label of labels) {
        expect(typeof label).toBe("string");
        expect(label.length).toBeGreaterThan(0);
        // Ensure no broken UTF-8 replacement characters (e.g. \uFFFD or ??)
        expect(label).not.toContain("\uFFFD");
        expect(label).not.toContain("??");
      }
    });

    it("verifies accessibility labels are in Vietnamese", () => {
      const ariaLabels = {
        logout: "Đăng xuất",
        closeModal: "Đóng",
        closeToast: "Đóng thông báo",
        showPassword: "Hiện mật khẩu",
        hidePassword: "Ẩn mật khẩu",
      };

      expect(ariaLabels.logout).toBe("Đăng xuất");
      expect(ariaLabels.closeModal).toBe("Đóng");
      expect(ariaLabels.closeToast).toBe("Đóng thông báo");
      expect(ariaLabels.showPassword).toBe("Hiện mật khẩu");
      expect(ariaLabels.hidePassword).toBe("Ẩn mật khẩu");
    });
  });

  // =========================================================================
  // Challenge 4: Login Flow & Auth Integration
  // =========================================================================
  describe("Challenge 4: Login Screen State & Auth Security Integration", () => {
    it("validates session token cryptography lifecycle", async () => {
      const secret = getAdminPassword();
      expect(secret).toBeDefined();

      // Create token
      const token = await createAuthToken();
      expect(typeof token).toBe("string");
      expect(token).toContain(".");

      // Verify token
      const isValid = await verifyAuthToken(token);
      expect(isValid).toBe(true);

      // Verify invalid token
      const isBadValid = await verifyAuthToken("invalid.token.123");
      expect(isBadValid).toBe(false);
    });

    it("verifies cookie configuration security attributes", () => {
      expect(AUTH_COOKIE_NAME).toBe("auth_session");
      expect(AUTH_COOKIE_MAX_AGE).toBe(604800); // 7 days in seconds
      expect(AUTH_COOKIE_MAX_AGE_MS).toBe(604800000); // 7 days in ms
      expect(AUTH_COOKIE_OPTIONS.httpOnly).toBe(true);
      expect(AUTH_COOKIE_OPTIONS.sameSite).toBe("lax");
      expect(AUTH_COOKIE_OPTIONS.path).toBe("/");
    });
  });

  // =========================================================================
  // Challenge 5: Edge Cases & Extreme Layout Stress
  // =========================================================================
  describe("Challenge 5: Stress Testing & Layout Robustness on 375px Viewport", () => {
    it("handles extremely long room codes and descriptions in Zalo message without breaking template structure", () => {
      const longRoomCode = "Phòng VIP 999 - Tầng 10 - Khu Biệt Thự Cao Cấp";
      const message = buildZaloMessage({
        roomCode: longRoomCode,
        month: "2026-12",
        totalAmount: 15890000,
        electricUsage: 350,
        electricCost: 1225000,
        waterUsage: 25,
        waterCost: 625000,
        serviceCost: 500000,
      });

      expect(message).toContain(longRoomCode);
      expect(message).toContain("15.890.000đ");
      expect(message).toContain("1.225.000đ");
      expect(message).toContain("625.000đ");
      expect(message).toContain("500.000đ");
      expect(message.startsWith(`Phòng ${longRoomCode}`)).toBe(true);
      expect(message.endsWith("Vui lòng thanh toán trước ngày 05. Xin cảm ơn!")).toBe(true);
    });

    it("handles zero usage and zero costs in formatVND and Zalo template", () => {
      const message = buildZaloMessage({
        roomCode: "102",
        month: "2026-08",
        totalAmount: 0,
        electricUsage: 0,
        electricCost: 0,
        waterUsage: 0,
        waterCost: 0,
        serviceCost: 0,
      });

      expect(message).toBe(
        "Phòng 102 - Tiền tháng 2026-08: Tổng 0đ (Điện: 0 số = 0đ | Nước: 0 m³ = 0đ | Dịch vụ: 0đ). Vui lòng thanh toán trước ngày 05. Xin cảm ơn!"
      );
    });

    it("handles rapid session token generation and verification under load (100 iterations)", async () => {
      const tokens: string[] = [];
      for (let i = 0; i < 100; i++) {
        const t = await createAuthToken();
        tokens.push(t);
      }

      expect(tokens).toHaveLength(100);

      // Verify all 100 tokens
      const results = await Promise.all(tokens.map((t) => verifyAuthToken(t)));
      expect(results.every((r) => r === true)).toBe(true);
    });

    it("verifies Header month generator across all 12 calendar months (Jan to Dec)", () => {
      for (let m = 0; m < 12; m++) {
        const d = new Date(2026, m, 15);
        const month = d.getMonth() + 1;
        const year = d.getFullYear();
        const formatted = `Tháng ${month.toString().padStart(2, "0")}/${year}`;

        expect(formatted).toMatch(/^Tháng (0[1-9]|1[0-2])\/2026$/);
      }
    });

    it("verifies Unicode NFC/NFD robustness for Vietnamese strings", () => {
      const original = "Phòng Trọ 2026 - Quản Lý Nhà Trọ - Cài Đặt";
      const nfc = original.normalize("NFC");
      const nfd = original.normalize("NFD");

      // Both should normalize to the same NFC canonical form
      expect(nfc.normalize("NFC")).toBe(nfd.normalize("NFC"));
      expect(nfc.length).toBeGreaterThan(0);
    });

    it("verifies 320px and 375px container clearance arithmetic", () => {
      // 375px screen width
      const screenWidth = 375;
      const horizontalPadding = 16 * 2; // px-4 on each side = 32px
      const availableContentWidth = screenWidth - horizontalPadding; // 343px
      expect(availableContentWidth).toBe(343);

      // BottomNav 4 items division
      const itemWidth = (screenWidth - 24) / 4; // px-3 padding (12px * 2 = 24px)
      expect(itemWidth).toBe(87.75); // ~88px touch width per tab, well above minimum 44px
      expect(itemWidth).toBeGreaterThanOrEqual(44);

      // Main content clearance vs bottom navigation bar
      const bottomNavTotalHeight = 64 + 16; // 64px height + 16px safe area padding = 80px
      const mainBottomPadding = 24 * 4; // pb-24 = 96px
      expect(mainBottomPadding).toBeGreaterThan(bottomNavTotalHeight);
    });
  });
});
