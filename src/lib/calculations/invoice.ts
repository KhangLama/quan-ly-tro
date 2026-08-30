import type { CalculationInput, CalculationResult } from "../../types/index.ts";

export function calculateInvoice(input: CalculationInput): CalculationResult {
  const electricUsage = Math.max(0, input.newElectric - input.oldElectric);
  const waterUsage = Math.max(0, input.newWater - input.oldWater);
  const electricCost = Math.round(electricUsage * input.electricPrice);
  const waterCost = Math.round(waterUsage * input.waterPrice);
  const servicePrice = Math.round(input.servicePrice || 0);
  const basePrice = Math.round(input.basePrice || 0);
  const discount = Math.max(0, Math.round(input.discount || 0));
  const subtotal = basePrice + electricCost + waterCost + servicePrice;
  const totalAmount = Math.max(0, subtotal - discount);

  return {
    electricUsage,
    waterUsage,
    electricCost,
    waterCost,
    servicePrice,
    basePrice,
    discount,
    totalAmount,
  };
}
