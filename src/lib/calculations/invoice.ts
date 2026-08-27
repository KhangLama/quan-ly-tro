import type { CalculationInput, CalculationResult } from "../../types/index.ts";

export function calculateInvoice(input: CalculationInput): CalculationResult {
  const electricUsage = Math.max(0, input.newElectric - input.oldElectric);
  const waterUsage = Math.max(0, input.newWater - input.oldWater);
  const electricCost = Math.round(electricUsage * input.electricPrice);
  const waterCost = Math.round(waterUsage * input.waterPrice);
  const servicePrice = Math.round(input.servicePrice);
  const basePrice = Math.round(input.basePrice);
  const totalAmount = basePrice + electricCost + waterCost + servicePrice;

  return {
    electricUsage,
    waterUsage,
    electricCost,
    waterCost,
    servicePrice,
    basePrice,
    totalAmount,
  };
}
