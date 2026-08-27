import type { ZaloMessageParams } from "../../types/index.ts";

export function buildZaloMessage(params: ZaloMessageParams): string {
  const fmt = (n: number) => new Intl.NumberFormat("vi-VN").format(n);
  return `Phòng ${params.roomCode} - Tiền tháng ${params.month}: Tổng ${fmt(params.totalAmount)}đ (Điện: ${params.electricUsage} số = ${fmt(params.electricCost)}đ | Nước: ${params.waterUsage} m³ = ${fmt(params.waterCost)}đ | Dịch vụ: ${fmt(params.serviceCost)}đ). Vui lòng thanh toán trước ngày 05. Xin cảm ơn!`;
}
