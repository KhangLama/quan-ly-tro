import React, { forwardRef } from "react";
import { formatVND, cn } from "@/lib/utils";
import {
  parsePaymentAccounts,
  buildVietQRUrl,
  getBankDisplayName,
  type PaymentAccountsConfig,
} from "@/lib/vietqr";

import type { CustomFeeItem } from "@/types";

export type QrDisplayFilter = "all" | "room" | "service";

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
  qrFilter?: QrDisplayFilter;
}

interface ReceiptCanvasProps {
  data: ReceiptData;
  qrFilter?: QrDisplayFilter;
  className?: string;
  style?: React.CSSProperties;
  id?: string;
}

export const ReceiptCanvas = forwardRef<HTMLDivElement, ReceiptCanvasProps>(
  ({ data, qrFilter, className, style, id = "receipt-canvas" }, ref) => {
    const activeQrFilter: QrDisplayFilter = qrFilter || data.qrFilter || "all";

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

    // Extract short month label for transfer description (e.g. "2026-10" -> "T10")
    const shortMonth = data.month?.includes("-")
      ? `T${parseInt(data.month.split("-")[1], 10) || data.month}`
      : data.month || "";

    // Payment and VietQR accounts resolution
    const paymentConfig = data.paymentConfig || parsePaymentAccounts(data.bankInfo);
    const isSplit = Boolean(
      paymentConfig.split &&
      paymentConfig.room.accountNumber &&
      paymentConfig.service.accountNumber
    );
    const hasAccount = Boolean(paymentConfig.room.accountNumber);

    // Ensure integer VND amounts and accurate partial payment handling
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
        // Tenant already paid exact utilities amount -> only room rent remains
        utilityAmount = 0;
        roomAmount = rawRoomAmount;
      } else {
        // Deduct partial payment from room rent first, then utilities
        roomAmount = Math.max(0, rawRoomAmount - safePaidAmount);
        const remainingPaid = Math.max(0, safePaidAmount - rawRoomAmount);
        utilityAmount = Math.max(0, rawUtilityAmount - remainingPaid);
      }
    }

    const roomTransferDesc = `${data.roomCode} ${shortMonth} TIEN PHONG`.trim();
    const serviceTransferDesc = `${data.roomCode} ${shortMonth} DIEN NUOC`.trim();
    const singleTransferDesc = `${data.roomCode} ${shortMonth}`.trim();

    // Generate VietQR URLs via same-origin PNG generator (/api/qr)
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
            description: serviceTransferDesc,
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

    const showRoomCard = activeQrFilter === "all" || activeQrFilter === "room";
    const showServiceCard = activeQrFilter === "all" || activeQrFilter === "service";
    const isSingleFocusedQr = activeQrFilter === "room" || activeQrFilter === "service";

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

        {/* VietQR Payment Section (Diagonal Anti-Collision & High-Contrast PNG Design) */}
        {hasAccount && (
          <div className="mt-3 pt-2.5 border-t-2 border-black">
            {isSplit ? (
              /* DUAL QR MODE: Diagonal Stagger (QR1 Left, QR2 Right) or Single Focused QR Mode */
              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-[11px] font-black uppercase tracking-wider text-slate-800">
                    {activeQrFilter === "room"
                      ? "MÃ VIETQR BƯỚC 1: THANH TOÁN TIỀN PHÒNG"
                      : activeQrFilter === "service"
                      ? "MÃ VIETQR BƯỚC 2: THANH TOÁN TIỀN ĐIỆN & NƯỚC"
                      : "QUÉT MÃ VIETQR THANH TOÁN (TÁCH RIÊNG 2 KHOẢN)"}
                  </div>
                  <p className="text-[10px] text-slate-600 font-medium mt-0.5">
                    {isSingleFocusedQr
                      ? "Ảnh chỉ có 1 mã QR cỡ lớn — Mở App Ngân hàng chọn ảnh này từ thư viện để quét chính xác 100%"
                      : "Mã Bước 1 đặt bên TRÁI, Mã Bước 2 đặt bên PHẢI để chống camera quét nhầm"}
                  </p>
                </div>

                {/* Card 1: Tiền phòng (Top Card - Xanh Dương, QR on LEFT) */}
                {showRoomCard && (
                  <div className="border-2 border-blue-600 rounded-xl p-3 bg-[#f0f7ff] shadow-xs">
                    <div className="bg-blue-600 text-white font-bold text-[11px] uppercase py-1 px-2.5 rounded-md tracking-wider flex items-center justify-between mb-2.5">
                      <span>BƯỚC 1: THANH TOÁN TIỀN PHÒNG</span>
                      <span className="text-[10px] font-semibold bg-white/20 px-2 py-0.5 rounded-sm">
                        {formatVND(roomAmount)} đ
                      </span>
                    </div>

                    { isSingleFocusedQr ? (
                      /* Centered Giant Single QR for 100% Photo Library Scan Accuracy */
                      <div className="flex flex-col items-center text-center space-y-2 py-1">
                        {roomQrUrl ? (
                          <div className="bg-white p-3 rounded-xl border-2 border-blue-300 inline-block shadow-xs">
                            <img
                              src={roomQrUrl}
                              alt="QR Tiền phòng"
                              crossOrigin="anonymous"
                              style={{ imageRendering: "pixelated" }}
                              className="w-[220px] h-[220px] object-contain block mx-auto"
                            />
                          </div>
                        ) : (
                          <div className="py-4 text-xs font-bold text-emerald-700">
                            ✓ Khoản tiền phòng đã thanh toán đủ (0 đ)
                          </div>
                        )}
                        <div className="text-xl font-black text-blue-700">
                          {formatVND(roomAmount)} đ
                        </div>
                        <div className="text-xs text-slate-800 space-y-0.5 bg-white/90 px-4 py-2 rounded-lg border border-blue-200 w-full max-w-[380px] text-left">
                          <div>Ngân hàng: <strong>{getBankDisplayName(paymentConfig.room.bank)}</strong></div>
                          <div className="font-mono">STK: <strong className="text-blue-900 bg-blue-100 px-1.5 py-0.5 rounded-sm">{paymentConfig.room.accountNumber}</strong></div>
                          {paymentConfig.room.accountName && (
                            <div className="uppercase text-slate-700">Chủ TK: <strong>{paymentConfig.room.accountName}</strong></div>
                          )}
                          <div>Nội dung CK: <strong className="text-blue-800">{roomTransferDesc}</strong></div>
                        </div>
                      </div>
                    ) : (
                      /* Diagonal Stagger Layout: QR on LEFT, Info on RIGHT */
                      <div className="flex items-center justify-between gap-4">
                        {roomQrUrl ? (
                          <div className="shrink-0 text-center">
                            <div className="bg-white p-2 rounded-xl border-2 border-blue-300 inline-block shadow-xs">
                              <img
                                src={roomQrUrl}
                                alt="QR Tiền phòng"
                                crossOrigin="anonymous"
                                style={{ imageRendering: "pixelated" }}
                                className="w-[164px] h-[164px] object-contain block"
                              />
                            </div>
                            <div className="text-[10px] font-extrabold text-blue-800 mt-1">
                              QR 1: Tiền Phòng ({formatVND(roomAmount)}đ)
                            </div>
                          </div>
                        ) : (
                          <div className="shrink-0 px-3 py-6 bg-white rounded-xl border border-blue-200 text-xs font-bold text-emerald-700">
                            ✓ Đã thu tiền phòng
                          </div>
                        )}

                        <div className="flex-1 min-w-0 space-y-1.5 text-left bg-white/80 p-2.5 rounded-lg border border-blue-200/80">
                          <div className="text-xs text-slate-600 font-bold">Số tiền chuyển khoản 1 (Tiền phòng):</div>
                          <div className="text-xl font-black text-blue-700 leading-none">
                            {formatVND(roomAmount)} đ
                          </div>
                          <div className="text-[11.5px] text-slate-800 space-y-1 pt-1">
                            <div>Ngân hàng: <strong>{getBankDisplayName(paymentConfig.room.bank)}</strong></div>
                            <div className="font-mono">STK: <strong className="text-blue-900 bg-blue-100/90 px-1.5 py-0.5 rounded-sm text-xs">{paymentConfig.room.accountNumber}</strong></div>
                            {paymentConfig.room.accountName && (
                              <div className="uppercase text-slate-800 leading-tight">Chủ TK: <strong>{paymentConfig.room.accountName}</strong></div>
                            )}
                            <div className="text-[11px] text-slate-600">Nội dung: <strong className="text-blue-800">{roomTransferDesc}</strong></div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Wide Safety Buffer & Transition Divider when showing both QR codes */}
                {showRoomCard && showServiceCard && (
                  <div className="relative flex items-center justify-center py-2">
                    <div className="border-t-2 border-dashed border-slate-400 w-full"></div>
                    <div className="absolute bg-slate-900 text-white px-3.5 py-1 rounded-full text-[10px] font-bold tracking-wide shadow-xs">
                      ⬇ KHOẢNG CÁCH AN TOÀN — QUÉT TIẾP BƯỚC 2 BÊN PHẢI ⬇
                    </div>
                  </div>
                )}

                {/* Card 2: Tiền điện nước (Bottom Card - Cam Hổ Phách, QR on RIGHT) */}
                {showServiceCard && (
                  <div className="border-2 border-amber-600 rounded-xl p-3 bg-[#fffaf5] shadow-xs">
                    <div className="bg-amber-600 text-white font-bold text-[11px] uppercase py-1 px-2.5 rounded-md tracking-wider flex items-center justify-between mb-2.5">
                      <span>BƯỚC 2: THANH TOÁN TIỀN ĐIỆN & NƯỚC</span>
                      <span className="text-[10px] font-semibold bg-white/20 px-2 py-0.5 rounded-sm">
                        {formatVND(utilityAmount)} đ
                      </span>
                    </div>

                    {isSingleFocusedQr ? (
                      /* Centered Giant Single QR for 100% Photo Library Scan Accuracy */
                      <div className="flex flex-col items-center text-center space-y-2 py-1">
                        {serviceQrUrl ? (
                          <div className="bg-white p-3 rounded-xl border-2 border-amber-300 inline-block shadow-xs">
                            <img
                              src={serviceQrUrl}
                              alt="QR Tiền điện nước"
                              crossOrigin="anonymous"
                              style={{ imageRendering: "pixelated" }}
                              className="w-[220px] h-[220px] object-contain block mx-auto"
                            />
                          </div>
                        ) : (
                          <div className="py-4 text-xs font-bold text-emerald-700">
                            ✓ Không phát sinh hoặc đã thu đủ tiền điện nước (0 đ)
                          </div>
                        )}
                        <div className="text-xl font-black text-amber-700">
                          {formatVND(utilityAmount)} đ
                        </div>
                        <div className="text-xs text-slate-800 space-y-0.5 bg-white/90 px-4 py-2 rounded-lg border border-amber-200 w-full max-w-[380px] text-left">
                          <div>Ngân hàng: <strong>{getBankDisplayName(paymentConfig.service.bank)}</strong></div>
                          <div className="font-mono">STK: <strong className="text-amber-900 bg-amber-100 px-1.5 py-0.5 rounded-sm">{paymentConfig.service.accountNumber}</strong></div>
                          {paymentConfig.service.accountName && (
                            <div className="uppercase text-slate-700">Chủ TK: <strong>{paymentConfig.service.accountName}</strong></div>
                          )}
                          <div>Nội dung CK: <strong className="text-amber-800">{serviceTransferDesc}</strong></div>
                        </div>
                      </div>
                    ) : (
                      /* Diagonal Stagger Layout: Info on LEFT, QR on RIGHT */
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex-1 min-w-0 space-y-1.5 text-left bg-white/80 p-2.5 rounded-lg border border-amber-200/80">
                          <div className="text-xs text-slate-600 font-bold">Số tiền chuyển khoản 2 (Điện & Nước):</div>
                          <div className="text-xl font-black text-amber-700 leading-none">
                            {formatVND(utilityAmount)} đ
                          </div>
                          <div className="text-[11.5px] text-slate-800 space-y-1 pt-1">
                            <div>Ngân hàng: <strong>{getBankDisplayName(paymentConfig.service.bank)}</strong></div>
                            <div className="font-mono">STK: <strong className="text-amber-900 bg-amber-100/90 px-1.5 py-0.5 rounded-sm text-xs">{paymentConfig.service.accountNumber}</strong></div>
                            {paymentConfig.service.accountName && (
                              <div className="uppercase text-slate-800 leading-tight">Chủ TK: <strong>{paymentConfig.service.accountName}</strong></div>
                            )}
                            <div className="text-[11px] text-slate-600">Nội dung: <strong className="text-amber-800">{serviceTransferDesc}</strong></div>
                          </div>
                        </div>

                        {serviceQrUrl ? (
                          <div className="shrink-0 text-center">
                            <div className="bg-white p-2 rounded-xl border-2 border-amber-300 inline-block shadow-xs">
                              <img
                                src={serviceQrUrl}
                                alt="QR Tiền điện nước"
                                crossOrigin="anonymous"
                                style={{ imageRendering: "pixelated" }}
                                className="w-[164px] h-[164px] object-contain block"
                              />
                            </div>
                            <div className="text-[10px] font-extrabold text-amber-800 mt-1">
                              QR 2: Điện Nước ({formatVND(utilityAmount)}đ)
                            </div>
                          </div>
                        ) : (
                          <div className="shrink-0 px-3 py-6 bg-white rounded-xl border border-amber-200 text-xs font-bold text-emerald-700">
                            ✓ Không phát sinh (0 đ)
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
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
