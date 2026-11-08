import React, { forwardRef } from "react";
import { formatVND, cn } from "@/lib/utils";
import {
  parsePaymentAccounts,
  buildVietQRUrl,
  getBankDisplayName,
  type PaymentAccountsConfig,
} from "@/lib/vietqr";

import type { CustomFeeItem } from "@/types";

export interface ReceiptData {
  roomCode: string;
  month: string; // e.g. "2026-08"
  customerName?: string;
  customerPhone?: string;
  reportDate?: string; // e.g. "07/05/2026"
  address?: string;
  bankInfo?: string;
  serviceDescription?: string;
  receiptNote?: string;
  oldElectric: number;
  newElectric: number;
  electricPrice: number;
  electricCost: number;
  electricUsage: number;
  oldWater: number;
  newWater: number;
  waterPrice: number;
  waterCost: number;
  waterUsage: number;
  basePrice: number;
  servicePrice: number;
  customFees?: CustomFeeItem[];
  discount?: number;
  discountReason?: string;
  totalAmount: number;
  paymentConfig?: PaymentAccountsConfig;
  isProrated?: boolean;
  stayDays?: number;
  daysInMonth?: number;
  stayDateRange?: string;
  originalBasePrice?: number;
  paidAmount?: number;
}

export interface ResolvedReceiptPayment {
  paymentConfig: PaymentAccountsConfig;
  isSplit: boolean;
  hasAccount: boolean;
  safeBasePrice: number;
  safeDiscount: number;
  safeTotalAmount: number;
  safePaidAmount: number;
  hasPartialPayment: boolean;
  effectiveQrAmount: number;
  roomAmount: number;
  utilityAmount: number;
  roomTransferDesc: string;
  serviceTransferDesc: string;
  singleTransferDesc: string;
  roomQrUrl: string | null;
  serviceQrUrl: string | null;
  singleQrUrl: string | null;
}

export function resolveReceiptPayment(data: ReceiptData): ResolvedReceiptPayment {
  const shortMonth = data.month?.includes("-")
    ? `T${parseInt(data.month.split("-")[1], 10) || data.month}`
    : data.month || "";

  const paymentConfig = data.paymentConfig || parsePaymentAccounts(data.bankInfo);
  const isSplit = Boolean(
    paymentConfig.split &&
      paymentConfig.room.accountNumber &&
      paymentConfig.service.accountNumber
  );
  const hasAccount = Boolean(paymentConfig.room.accountNumber);

  const safeBasePrice = Math.max(0, Math.round(data.basePrice || 0));
  const safeDiscount = Math.max(0, Math.round(data.discount || 0));
  const safeTotalAmount = Math.max(0, Math.round(data.totalAmount || 0));
  const safePaidAmount =
    data.paidAmount !== undefined && data.paidAmount !== null
      ? Math.max(0, Math.round(data.paidAmount))
      : 0;

  const hasPartialPayment = safePaidAmount > 0 && safePaidAmount < safeTotalAmount;
  const effectiveQrAmount = hasPartialPayment
    ? Math.max(0, safeTotalAmount - safePaidAmount)
    : safeTotalAmount;

  const rawRoomAmount = Math.max(0, safeBasePrice - safeDiscount);
  const rawUtilityAmount = Math.max(0, safeTotalAmount - rawRoomAmount);

  let roomAmount = rawRoomAmount;
  let utilityAmount = rawUtilityAmount;

  if (hasPartialPayment) {
    if (safePaidAmount === rawUtilityAmount && rawUtilityAmount > 0) {
      utilityAmount = 0;
      roomAmount = rawRoomAmount;
    } else {
      roomAmount = Math.max(0, rawRoomAmount - safePaidAmount);
      const remainingPaid = Math.max(0, safePaidAmount - rawRoomAmount);
      utilityAmount = Math.max(0, rawUtilityAmount - remainingPaid);
    }
  }

  const roomTransferDesc = `${data.roomCode} ${shortMonth} TIEN PHONG`.trim();
  const serviceTransferDesc = ""; // Để mặc định theo App Ngân hàng cho khoản tiền điện nước
  const singleTransferDesc = `${data.roomCode} ${shortMonth}`.trim();

  const roomQrUrl =
    paymentConfig.room.accountNumber && roomAmount > 0
      ? buildVietQRUrl({
          bankCode: paymentConfig.room.bank,
          accountNumber: paymentConfig.room.accountNumber,
          accountName: paymentConfig.room.accountName,
          amount: roomAmount,
          description: roomTransferDesc,
        })
      : null;

  const serviceQrUrl =
    paymentConfig.service.accountNumber && utilityAmount > 0
      ? buildVietQRUrl({
          bankCode: paymentConfig.service.bank,
          accountNumber: paymentConfig.service.accountNumber,
          accountName: paymentConfig.service.accountName,
          amount: utilityAmount,
        })
      : null;

  const singleQrUrl =
    paymentConfig.room.accountNumber && effectiveQrAmount > 0
      ? buildVietQRUrl({
          bankCode: paymentConfig.room.bank,
          accountNumber: paymentConfig.room.accountNumber,
          accountName: paymentConfig.room.accountName,
          amount: effectiveQrAmount,
          description: singleTransferDesc,
        })
      : null;

  return {
    paymentConfig,
    isSplit,
    hasAccount,
    safeBasePrice,
    safeDiscount,
    safeTotalAmount,
    safePaidAmount,
    hasPartialPayment,
    effectiveQrAmount,
    roomAmount,
    utilityAmount,
    roomTransferDesc,
    serviceTransferDesc,
    singleTransferDesc,
    roomQrUrl,
    serviceQrUrl,
    singleQrUrl,
  };
}

interface ReceiptCanvasProps {
  data: ReceiptData;
  className?: string;
  style?: React.CSSProperties;
  id?: string;
}

/**
 * Ảnh 1: Tờ Phiếu Báo Tiền Phòng (Bảng kê chi tiết).
 * Khi tách 2 tài khoản (isSplit = true), bảng kê chỉ hiển thị rõ thông tin STK 2 khoản bằng chữ
 * và tách 2 mã QR thành 2 ảnh Thẻ QR độc lập (StandaloneQrCard) để các App Ngân hàng quét ảnh 100% chuẩn xác.
 */
export const ReceiptCanvas = forwardRef<HTMLDivElement, ReceiptCanvasProps>(
  ({ data, className, style, id = "receipt-canvas" }, ref) => {
    const formatDate = () => {
      const today = new Date();
      const dd = String(today.getDate()).padStart(2, "0");
      const mm = String(today.getMonth() + 1).padStart(2, "0");
      const yyyy = today.getFullYear();
      return `${dd}/${mm}/${yyyy}`;
    };

    const reportDate = data.reportDate || formatDate();
    const address =
      data.address || "325B Kv. Phú Mỹ, Thường Thạnh, Cái Răng, Cần Thơ";
    const customerName = data.customerName || "Khách thuê";

    const {
      paymentConfig,
      isSplit,
      hasAccount,
      safeBasePrice,
      safeDiscount,
      safeTotalAmount,
      safePaidAmount,
      hasPartialPayment,
      effectiveQrAmount,
      roomAmount,
      utilityAmount,
      roomTransferDesc,
      serviceTransferDesc,
      singleTransferDesc,
      singleQrUrl,
    } = resolveReceiptPayment(data);

    return (
      <div
        ref={ref}
        id={id}
        className={cn(
          "bg-white text-slate-900 mx-auto p-4 sm:p-5 w-[580px] text-[13px] leading-snug font-sans select-none rounded-lg shadow-sm",
          className
        )}
        style={{ minWidth: "580px", ...style }}
      >
        {/* Header Banner */}
        <div className="bg-[#F8D7DA] text-slate-900 font-extrabold text-center text-lg uppercase py-2 tracking-wide border-2 border-black">
          NHÀ TRỌ TRÚC LAM
        </div>

        {/* Address Box */}
        <div className="grid grid-cols-12 border-x-2 border-b-2 border-black min-h-[50px]">
          <div className="col-span-5 p-2 border-r-2 border-black font-bold">
            <div>Địa chỉ:</div>
            <div className="font-normal text-xs mt-0.5 text-slate-800 whitespace-pre-line">
              {address}
            </div>
          </div>
          <div className="col-span-7 p-2 flex flex-col justify-around">
            <div className="border-b border-dashed border-slate-400 w-full h-3"></div>
            <div className="border-b border-dashed border-slate-400 w-full h-3"></div>
          </div>
        </div>

        {/* Title */}
        <div className="border-x-2 border-b-2 border-black font-extrabold text-center text-base uppercase py-1.5 tracking-wider bg-white">
          PHIẾU BÁO TIỀN PHÒNG
        </div>

        {/* Room & Customer Info */}
        <div className="border-x-2 border-b-2 border-black">
          <div className="grid grid-cols-12 border-b border-black">
            <div className="col-span-4 p-1.5 border-r border-black flex items-center gap-2">
              <span className="font-bold text-rose-600">Phòng:</span>
              <span className="bg-slate-100 px-3 py-0.5 rounded-full font-extrabold text-slate-900 border border-slate-300">
                {data.roomCode}
              </span>
            </div>
            <div className="col-span-8 p-1.5 flex items-center gap-2">
              <span className="font-bold">Khách hàng:</span>
              <span className="font-semibold text-slate-800">{customerName}</span>
            </div>
          </div>

          <div className="grid grid-cols-12">
            <div className="col-span-4 p-1.5 border-r border-black"></div>
            <div className="col-span-8 p-1.5 grid grid-cols-12 items-center">
              <span className="col-span-4 font-bold">Ngày báo:</span>
              <span className="col-span-8 font-medium">{reportDate}</span>
            </div>
          </div>
        </div>

        {/* Breakdown Table */}
        <table className="w-full border-collapse border-x-2 border-b-2 border-black text-left text-xs mt-0">
          <thead>
            <tr className="border-b-2 border-black bg-slate-50 font-bold text-center">
              <th className="border-r border-black p-1.5 w-[22%]">Nội dung</th>
              <th className="border-r border-black p-1.5 w-[26%]">Mô tả</th>
              <th className="border-r border-black p-1.5 w-[17%]">Đơn giá</th>
              <th className="border-r border-black p-1.5 w-[13%]">Số lượng</th>
              <th className="p-1.5 w-[22%] text-right pr-2">Thành tiền</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black">
            {/* 1. Rent */}
            <tr>
              <td className="border-r border-black p-1.5 font-medium">
                <div>1- Tiền thuê</div>
                {data.isProrated && (
                  <div className="text-[10px] text-indigo-700 font-bold tracking-tight">
                    (Theo ngày thực tế)
                  </div>
                )}
              </td>
              <td className="border-r border-black p-1.5 text-[11px] text-slate-800 leading-normal">
                {data.isProrated && data.stayDays ? (
                  <div className="space-y-0.5">
                    <div>
                      Ở thực tế: <strong>{data.stayDays} ngày</strong>
                      {data.daysInMonth ? ` (${data.daysInMonth} ngày/tháng)` : ""}
                    </div>
                    {data.stayDateRange && (
                      <div className="text-slate-600 font-medium text-[10px]">
                        Khoảng ngày: {data.stayDateRange}
                      </div>
                    )}
                  </div>
                ) : (
                  <span className="text-slate-500 italic">Trọn tháng</span>
                )}
              </td>
              <td className="border-r border-black p-1.5 text-right font-medium whitespace-nowrap">
                {formatVND(data.isProrated && data.originalBasePrice ? data.originalBasePrice : safeBasePrice)} đ
              </td>
              <td className="border-r border-black p-1.5 text-center font-bold">
                {data.isProrated && data.stayDays ? `${data.stayDays} ngày` : "1"}
              </td>
              <td className="p-1.5 text-right font-bold pr-2 whitespace-nowrap">
                {formatVND(safeBasePrice)} đ
              </td>
            </tr>

            {/* 2. Electricity */}
            <tr>
              <td className="border-r border-black p-1.5 font-medium">2- Tiền điện</td>
              <td className="border-r border-black p-1.5 text-[11px] text-slate-800 leading-normal">
                <div>Chỉ số mới: <strong>{data.newElectric}</strong></div>
                <div>Chỉ số cũ: <strong>{data.oldElectric}</strong></div>
              </td>
              <td className="border-r border-black p-1.5 text-right font-medium whitespace-nowrap">
                {formatVND(data.electricPrice)} đ
              </td>
              <td className="border-r border-black p-1.5 text-center font-bold text-amber-700">
                {data.electricUsage}
              </td>
              <td className="p-1.5 text-right font-bold pr-2 whitespace-nowrap">
                {formatVND(data.electricCost)} đ
              </td>
            </tr>

            {/* 3. Water */}
            <tr>
              <td className="border-r border-black p-1.5 font-medium">3- Tiền nước</td>
              <td className="border-r border-black p-1.5 text-[11px] text-slate-800 leading-normal">
                <div>Chỉ số mới: <strong>{data.newWater}</strong></div>
                <div>Chỉ số cũ: <strong>{data.oldWater}</strong></div>
              </td>
              <td className="border-r border-black p-1.5 text-right font-medium whitespace-nowrap">
                {formatVND(data.waterPrice)} đ
              </td>
              <td className="border-r border-black p-1.5 text-center font-bold text-sky-700">
                {data.waterUsage}
              </td>
              <td className="p-1.5 text-right font-bold pr-2 whitespace-nowrap">
                {formatVND(data.waterCost)} đ
              </td>
            </tr>

            {/* 4. Service / Other Expenses */}
            {data.customFees && data.customFees.length > 0 ? (
              data.customFees.map((fee, idx) => (
                <tr key={fee.id || idx}>
                  {idx === 0 && (
                    <td
                      rowSpan={data.customFees!.length}
                      className="border-r border-black p-1.5 font-medium align-middle"
                    >
                      4- Chi phí khác
                    </td>
                  )}
                  <td className="border-r border-black p-1.5 text-[11px] text-slate-800 leading-normal">
                    {fee.name || "Chi phí khác"}
                  </td>
                  <td className="border-r border-black p-1.5 text-right font-medium whitespace-nowrap">
                    {formatVND(fee.unitPrice || 0)} đ
                  </td>
                  <td className="border-r border-black p-1.5 text-center font-bold">
                    {fee.quantity || 1}
                  </td>
                  <td className="p-1.5 text-right font-bold pr-2 whitespace-nowrap">
                    {formatVND((fee.unitPrice || 0) * (fee.quantity || 1))} đ
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="border-r border-black p-1.5 font-medium">4- Chi phí khác</td>
                <td className="border-r border-black p-1.5 text-[11px] text-slate-600">
                  {data.servicePrice > 0 ? (data.serviceDescription || "") : ""}
                </td>
                <td className="border-r border-black p-1.5 text-right font-medium whitespace-nowrap">
                  {formatVND(data.servicePrice || 0)} đ
                </td>
                <td className="border-r border-black p-1.5 text-center">
                  {data.servicePrice > 0 ? 1 : 0}
                </td>
                <td className="p-1.5 text-right font-bold pr-2 whitespace-nowrap">
                  {formatVND(data.servicePrice || 0)} đ
                </td>
              </tr>
            )}

            {/* 5. Discount if any */}
            {safeDiscount > 0 && (
              <tr className="bg-emerald-50/70">
                <td className="border-r border-black p-1.5 font-bold text-emerald-800">5- Giảm giá / Ưu đãi</td>
                <td className="border-r border-black p-1.5 text-[11px] text-emerald-800 italic">
                  {data.discountReason || "Khuyến mãi / Event giảm giá"}
                </td>
                <td className="border-r border-black p-1.5 text-right font-bold text-emerald-700 whitespace-nowrap">
                  -{formatVND(safeDiscount)} đ
                </td>
                <td className="border-r border-black p-1.5 text-center font-bold text-emerald-700">1</td>
                <td className="p-1.5 text-right font-bold text-emerald-700 pr-2 whitespace-nowrap">
                  -{formatVND(safeDiscount)} đ
                </td>
              </tr>
            )}

            {/* TOTAL ROW */}
            <tr className="border-t-2 border-black font-extrabold text-[13px]">
              <td colSpan={4} className="border-r border-black p-2 text-center uppercase tracking-wider bg-white">
                Tổng cộng
              </td>
              <td className="p-2 text-right text-base font-black text-rose-700 bg-[#FFF2CC] pr-2 whitespace-nowrap">
                {formatVND(safeTotalAmount)} đ
              </td>
            </tr>

            {/* PARTIAL PAYMENT ROWS IF APPLICABLE */}
            {hasPartialPayment && (
              <>
                <tr className="bg-emerald-50/80 font-bold text-xs border-t border-black">
                  <td colSpan={4} className="border-r border-black p-1.5 text-right text-emerald-800">
                    Đã thanh toán (Thực nhận):
                  </td>
                  <td className="p-1.5 text-right font-black text-emerald-700 pr-2 whitespace-nowrap">
                    {formatVND(safePaidAmount)} đ
                  </td>
                </tr>
                <tr className="bg-rose-50/90 font-bold text-xs border-t border-black">
                  <td colSpan={4} className="border-r border-black p-1.5 text-right text-rose-800 uppercase">
                    Còn nợ lại:
                  </td>
                  <td className="p-1.5 text-right font-black text-rose-700 pr-2 whitespace-nowrap">
                    {formatVND(effectiveQrAmount)} đ
                  </td>
                </tr>
              </>
            )}

            {safePaidAmount >= safeTotalAmount && safeTotalAmount > 0 && (
              <tr className="bg-emerald-50/80 font-bold text-xs border-t border-black">
                <td colSpan={5} className="p-1.5 text-center text-emerald-800 uppercase tracking-wider">
                  ✓ ĐÃ THANH TOÁN ĐỦ ({formatVND(safePaidAmount)} đ)
                </td>
              </tr>
            )}

            {/* NOTE ROW */}
            <tr>
              <td className="border-r border-black p-2 font-bold italic">Ghi chú:</td>
              <td colSpan={4} className="p-2 text-xs text-slate-700 font-medium whitespace-pre-line leading-relaxed">
                {data.receiptNote || "Vui lòng thanh toán đúng hạn trước ngày 05 hàng tháng. Xin cảm ơn!"}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Payment Account Info Section */}
        {hasAccount && (
          <div className="mt-3 pt-2.5 border-t-2 border-black">
            {isSplit ? (
              /* SPLIT 2 ACCOUNTS SUMMARY ON RECEIPT (Actual QR codes are exported as 2 separate standalone cards!) */
              <div className="space-y-2">
                <div className="text-center text-[11px] font-black uppercase tracking-wider text-slate-800">
                  THÔNG TIN CHUYỂN KHOẢN THANH TOÁN (TÁCH 2 KHOẢN)
                </div>

                <div className="grid grid-cols-2 gap-2.5 text-xs">
                  {/* Account 1: Room Rent */}
                  <div className="border-2 border-blue-600 rounded-xl p-2.5 bg-[#f0f7ff]">
                    <div className="bg-blue-600 text-white font-bold text-[10.5px] uppercase py-1 px-2 rounded-md mb-1.5 flex items-center justify-between">
                      <span>KHOẢN 1: TIỀN PHÒNG</span>
                      <span>{formatVND(roomAmount)} đ</span>
                    </div>
                    <div className="space-y-0.5 text-[11px] text-slate-800">
                      <div>Ngân hàng: <strong>{getBankDisplayName(paymentConfig.room.bank)}</strong></div>
                      <div className="font-mono">STK: <strong className="text-blue-900 bg-blue-100 px-1 py-0.5 rounded-sm">{paymentConfig.room.accountNumber}</strong></div>
                      {paymentConfig.room.accountName && (
                        <div className="truncate uppercase">Chủ TK: <strong>{paymentConfig.room.accountName}</strong></div>
                      )}
                      <div>Nội dung: <strong className="text-blue-800">{roomTransferDesc}</strong></div>
                    </div>
                  </div>

                  {/* Account 2: Utilities */}
                  <div className="border-2 border-amber-600 rounded-xl p-2.5 bg-[#fffaf5]">
                    <div className="bg-amber-600 text-white font-bold text-[10.5px] uppercase py-1 px-2 rounded-md mb-1.5 flex items-center justify-between">
                      <span>KHOẢN 2: ĐIỆN & NƯỚC</span>
                      <span>{formatVND(utilityAmount)} đ</span>
                    </div>
                    <div className="space-y-0.5 text-[11px] text-slate-800">
                      <div>Ngân hàng: <strong>{getBankDisplayName(paymentConfig.service.bank)}</strong></div>
                      <div className="font-mono">STK: <strong className="text-amber-900 bg-amber-100 px-1 py-0.5 rounded-sm">{paymentConfig.service.accountNumber}</strong></div>
                      {paymentConfig.service.accountName && (
                        <div className="truncate uppercase">Chủ TK: <strong>{paymentConfig.service.accountName}</strong></div>
                      )}
                      {serviceTransferDesc && (
                        <div>Nội dung: <strong className="text-amber-800">{serviceTransferDesc}</strong></div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* SINGLE QR MODE: 1 Unified Account for Effective Remaining Amount */
              <div className="max-w-[360px] mx-auto border-2 border-black rounded-xl p-3 bg-slate-50 text-center shadow-2xs">
                <div className="bg-slate-900 text-white font-bold text-[11px] uppercase py-1 px-2.5 rounded-md tracking-wide mb-2">
                  QUÉT MÃ VIETQR THANH TOÁN
                </div>

                {singleQrUrl ? (
                  <div className="bg-white p-2.5 rounded-xl border-2 border-slate-300 inline-block shadow-2xs mx-auto mb-1.5">
                    <img
                      src={singleQrUrl}
                      alt="Mã VietQR thanh toán"
                      crossOrigin="anonymous"
                      style={{ imageRendering: "pixelated" }}
                      className="w-[200px] h-[200px] object-contain mx-auto block"
                    />
                  </div>
                ) : (
                  <div className="py-4 text-xs font-bold text-emerald-700">
                    ✓ Hóa đơn đã thanh toán đủ
                  </div>
                )}

                <div className="text-lg font-black text-rose-700 mt-0.5">
                  {formatVND(effectiveQrAmount)} đ
                </div>

                <div className="mt-2 pt-2 border-t border-slate-200 text-[11px] text-slate-700 space-y-0.5 text-left bg-white p-2 rounded-lg border">
                  <div>Ngân hàng: <strong>{getBankDisplayName(paymentConfig.room.bank)}</strong></div>
                  <div className="font-mono">STK: <strong>{paymentConfig.room.accountNumber}</strong></div>
                  {paymentConfig.room.accountName && (
                    <div className="truncate uppercase">Chủ TK: <strong>{paymentConfig.room.accountName}</strong></div>
                  )}
                  <div>Nội dung CK: <strong>{singleTransferDesc}</strong></div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer Thank You Note */}
        <div className="mt-3 text-[11px] text-slate-600 space-y-0.5 text-center italic">
          <p>
            Cảm ơn bạn đã thanh toán đúng hạn! Chúc bạn có những phút giây thoải mái và trải nghiệm tuyệt vời tại phòng trọ của chúng tôi.
          </p>
          <p className="font-semibold text-slate-700 not-italic">
            Mọi thắc mắc hoặc cần hỗ trợ vui lòng liên hệ hotline ban quản lý.
          </p>
        </div>
      </div>
    );
  }
);

ReceiptCanvas.displayName = "ReceiptCanvas";

export interface StandaloneQrCardProps {
  data: ReceiptData;
  kind: "room" | "service";
  className?: string;
  id?: string;
}

/**
 * Thẻ QR Độc Lập (Ảnh 2: Thẻ QR Tiền Phòng & Ảnh 3: Thẻ QR Điện Nước).
 * Mỗi bức ảnh chỉ chứa DUY NHẤT 1 Mã QR cỡ đại (280x280px) ở chính giữa,
 * đảm bảo khi khách chọn ảnh từ thư viện trong App Ngân hàng sẽ quét trúng 100% đúng số tiền.
 */
export const StandaloneQrCard = forwardRef<HTMLDivElement, StandaloneQrCardProps>(
  ({ data, kind, className, id }, ref) => {
    const {
      paymentConfig,
      roomAmount,
      utilityAmount,
      roomTransferDesc,
      serviceTransferDesc,
      roomQrUrl,
      serviceQrUrl,
    } = resolveReceiptPayment(data);

    const isRoom = kind === "room";
    const amount = isRoom ? roomAmount : utilityAmount;
    const qrUrl = isRoom ? roomQrUrl : serviceQrUrl;
    const account = isRoom ? paymentConfig.room : paymentConfig.service;
    const transferDesc = isRoom ? roomTransferDesc : serviceTransferDesc;

    return (
      <div
        ref={ref}
        id={id}
        className={cn(
          "bg-white text-slate-900 mx-auto p-5 w-[440px] font-sans select-none rounded-2xl border-2",
          isRoom ? "border-blue-600 bg-[#f5f9ff]" : "border-amber-600 bg-[#fffaf2]",
          className
        )}
        style={{ minWidth: "440px", maxWidth: "440px" }}
      >
        {/* Top Banner */}
        <div
          className={cn(
            "text-white text-center py-2.5 px-4 rounded-xl font-extrabold uppercase tracking-wide shadow-xs",
            isRoom ? "bg-blue-600" : "bg-amber-600"
          )}
        >
          <div className="text-[11px] opacity-90 font-bold">
            NHÀ TRỌ TRÚC LAM • PHÒNG {data.roomCode} ({data.month})
          </div>
          <div className="text-sm mt-0.5">
            {isRoom
              ? "KHOẢN 1: THANH TOÁN TIỀN PHÒNG"
              : "KHOẢN 2: THANH TOÁN ĐIỆN & NƯỚC"}
          </div>
        </div>

        {/* Single Centered Giant QR Code */}
        <div className="my-4 flex flex-col items-center justify-center">
          {qrUrl ? (
            <div
              className={cn(
                "bg-white p-3.5 rounded-2xl border-2 shadow-xs inline-block",
                isRoom ? "border-blue-300" : "border-amber-300"
              )}
            >
              <img
                src={qrUrl}
                alt={isRoom ? "Mã QR Tiền Phòng" : "Mã QR Điện Nước"}
                crossOrigin="anonymous"
                style={{ imageRendering: "pixelated" }}
                className="w-[280px] h-[280px] object-contain block mx-auto"
              />
            </div>
          ) : (
            <div className="py-10 px-6 bg-white rounded-2xl border text-center text-xs font-bold text-emerald-700">
              ✓ Khoản này không phát sinh hoặc đã thanh toán đủ (0 đ)
            </div>
          )}

          {/* Amount Highlight */}
          <div className="mt-3 text-center">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Số tiền thanh toán
            </div>
            <div
              className={cn(
                "text-2xl font-black tracking-tight mt-0.5",
                isRoom ? "text-blue-700" : "text-amber-700"
              )}
            >
              {formatVND(amount)} đ
            </div>
          </div>
        </div>

        {/* Account Details Box */}
        <div
          className={cn(
            "bg-white rounded-xl p-3 border text-xs space-y-1 text-slate-800",
            isRoom ? "border-blue-200" : "border-amber-200"
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-medium">Ngân hàng:</span>
            <strong className="text-slate-900">{getBankDisplayName(account.bank)}</strong>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-medium">Số tài khoản:</span>
            <strong
              className={cn(
                "font-mono text-sm px-1.5 py-0.5 rounded-sm",
                isRoom ? "bg-blue-100 text-blue-900" : "bg-amber-100 text-amber-900"
              )}
            >
              {account.accountNumber}
            </strong>
          </div>
          {account.accountName && (
            <div className="flex items-center justify-between gap-2">
              <span className="text-slate-500 font-medium shrink-0">Chủ tài khoản:</span>
              <strong className="uppercase text-right truncate">{account.accountName}</strong>
            </div>
          )}
          {transferDesc && (
            <div className="flex items-center justify-between pt-1 border-t border-slate-100">
              <span className="text-slate-500 font-medium">Nội dung CK:</span>
              <strong className={isRoom ? "text-blue-700" : "text-amber-700"}>
                {transferDesc}
              </strong>
            </div>
          )}
        </div>
      </div>
    );
  }
);

StandaloneQrCard.displayName = "StandaloneQrCard";
