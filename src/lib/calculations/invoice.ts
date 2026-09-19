import type { CalculationInput, CalculationResult } from "../../types/index.ts";

/**
 * Calculates prorated rent based on days stayed vs total days in month.
 * Formula: Math.round((basePrice / daysInMonth) * stayDays)
 */
export function calculateProratedRent(
  basePrice: number,
  daysInMonth: number,
  stayDays: number
): number {
  if (daysInMonth <= 0 || stayDays <= 0 || basePrice <= 0) return 0;
  const clampedDays = Math.min(stayDays, daysInMonth);
  return Math.round((basePrice / daysInMonth) * clampedDays);
}

/**
 * Returns the number of days in a given 'YYYY-MM' month string.
 */
export function getDaysInMonth(monthStr?: string): number {
  if (!monthStr || !monthStr.includes("-")) {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  }
  const [yearStr, monthNumStr] = monthStr.split("-");
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthNumStr, 10);
  if (isNaN(year) || isNaN(month) || month < 1 || month > 12) return 30;
  return new Date(year, month, 0).getDate();
}

/**
 * Computes the number of stay days between two YYYY-MM-DD dates (inclusive).
 */
export function calculateStayDaysFromDates(startDate: string, endDate: string): number {
  if (!startDate || !endDate) return 0;
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;
  const diffTime = end.getTime() - start.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1;
  return Math.max(0, diffDays);
}

/**
 * Evaluates payment state and remaining debt.
 */
export function calculatePaymentStatus(
  totalAmount: number,
  paidAmount?: number | null
): {
  status: "paid" | "partial" | "pending";
  label: "Đã thu" | "Còn nợ" | "Chưa thu";
  remainingAmount: number;
} {
  const safeTotal = Math.max(0, Math.round(totalAmount || 0));
  const safePaid =
    paidAmount !== undefined && paidAmount !== null
      ? Math.max(0, Math.round(paidAmount))
      : 0;

  if (safePaid >= safeTotal) {
    return { status: "paid", label: "Đã thu", remainingAmount: 0 };
  }
  if (safePaid > 0 && safePaid < safeTotal) {
    return { status: "partial", label: "Còn nợ", remainingAmount: safeTotal - safePaid };
  }
  return { status: "pending", label: "Chưa thu", remainingAmount: safeTotal };
}

/**
 * Forgives remaining debt by transferring remaining debt into discount.
 * Balances invoice to 0 debt (totalAmount == paidAmount).
 */
export function forgiveRemainingDebt(params: {
  subtotal: number;
  currentDiscount: number;
  paidAmount: number;
  currentReason?: string;
}): {
  newDiscount: number;
  newReason: string;
  newTotalAmount: number;
  remainingAmount: number;
} {
  const currentTotal = Math.max(0, params.subtotal - params.currentDiscount);
  const remainingDebt = Math.max(0, currentTotal - params.paidAmount);
  const newDiscount = params.currentDiscount + remainingDebt;
  const newTotalAmount = Math.max(0, params.subtotal - newDiscount);
  const reasonSuffix = "Miễn giảm nợ khi tất toán";
  const newReason = params.currentReason && params.currentReason.trim()
    ? `${params.currentReason.trim()} (${reasonSuffix})`
    : reasonSuffix;

  return {
    newDiscount,
    newReason,
    newTotalAmount,
    remainingAmount: Math.max(0, newTotalAmount - params.paidAmount),
  };
}

export function calculateInvoice(input: CalculationInput): CalculationResult {
  const electricUsage = Math.max(0, input.newElectric - input.oldElectric);
  const waterUsage = Math.max(0, input.newWater - input.oldWater);
  const electricCost = Math.round(electricUsage * input.electricPrice);
  const waterCost = Math.round(waterUsage * input.waterPrice);
  const servicePrice = Math.round(input.servicePrice || 0);

  const isProrated = Boolean(
    input.isProrated &&
    input.daysInMonth &&
    input.daysInMonth > 0 &&
    input.stayDays !== undefined &&
    input.stayDays > 0
  );

  const effectiveBasePrice = isProrated
    ? calculateProratedRent(input.basePrice || 0, input.daysInMonth!, input.stayDays!)
    : Math.round(input.basePrice || 0);

  const discount = Math.max(0, Math.round(input.discount || 0));
  const subtotal = effectiveBasePrice + electricCost + waterCost + servicePrice;
  const totalAmount = Math.max(0, subtotal - discount);

  const paidAmount =
    input.paidAmount !== undefined && input.paidAmount !== null
      ? Math.max(0, Math.round(input.paidAmount))
      : undefined;

  const paymentStatus = calculatePaymentStatus(totalAmount, paidAmount ?? 0);
  const remainingAmount = paymentStatus.remainingAmount;

  return {
    electricUsage,
    waterUsage,
    electricCost,
    waterCost,
    servicePrice,
    basePrice: effectiveBasePrice,
    originalBasePrice: isProrated ? Math.round(input.basePrice || 0) : undefined,
    isProrated,
    stayDays: isProrated ? input.stayDays : undefined,
    daysInMonth: isProrated ? input.daysInMonth : undefined,
    discount,
    totalAmount,
    paidAmount,
    remainingAmount,
    remainingBalance: remainingAmount,
    paymentStatus,
  };
}
