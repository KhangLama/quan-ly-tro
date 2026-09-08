import React, { forwardRef } from "react";
import { formatVND, cn } from "@/lib/utils";
import {
  parsePaymentAccounts,
  buildVietQRUrl,
  getBankDisplayName,
  type PaymentAccountsConfig,
} from "@/lib/vietqr";

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
  discount?: number;
  discountReason?: string;
  totalAmount: number;
  paymentConfig?: PaymentAccountsConfig;
}

interface ReceiptCanvasProps {
  data: ReceiptData;
  className?: string;
  style?: React.CSSProperties;
  id?: string;
}

export const ReceiptCanvas = forwardRef<HTMLDivElement, ReceiptCanvasProps>(
  ({ data, className, style, id = "receipt-canvas" }, ref) => {
    const formatDate = (monthStr: string) => {
      const today = new Date();
      const dd = String(today.getDate()).padStart(2, "0");
      const mm = String(today.getMonth() + 1).padStart(2, "0");
      const yyyy = today.getFullYear();
      return `${dd}/${mm}/${yyyy}`;
    };

    const reportDate = data.reportDate || formatDate(data.month);
    const address =
      data.address || "325B Kv. Phú Mỹ, Thường Thạnh, Cái Răng, Cần Thơ";
    const customerName = data.customerName || "Khách thuê";

    // Payment and VietQR accounts resolution
    const paymentConfig = data.paymentConfig || parsePaymentAccounts(data.bankInfo);
    const isSplit = Boolean(
      paymentConfig.split &&
      paymentConfig.room.accountNumber &&
      paymentConfig.service.accountNumber
    );
    const hasAccount = Boolean(paymentConfig.room.accountNumber);

    // Calculate exact split amounts
    const roomAmount = Math.max(0, data.basePrice - (data.discount || 0));
    const utilityAmount = Math.max(0, data.totalAmount - roomAmount);

    const cleanMonth = data.month.includes("-")
      ? `T${data.month.split("-")[1]}`
      : data.month;

    // Generate VietQR URLs
    const roomQrUrl = paymentConfig.room.accountNumber
      ? buildVietQRUrl({
          bankCode: paymentConfig.room.bank,
          accountNumber: paymentConfig.room.accountNumber,
          accountName: paymentConfig.room.accountName,
          amount: roomAmount,
          description: `P${data.roomCode} TIEN PHONG ${cleanMonth}`,
        })
      : null;

    const serviceQrUrl = paymentConfig.service.accountNumber
      ? buildVietQRUrl({
          bankCode: paymentConfig.service.bank,
          accountNumber: paymentConfig.service.accountNumber,
          accountName: paymentConfig.service.accountName,
          amount: utilityAmount,
          description: `P${data.roomCode} DIEN NUOC ${cleanMonth}`,
        })
      : null;

    const singleQrUrl = paymentConfig.room.accountNumber
      ? buildVietQRUrl({
          bankCode: paymentConfig.room.bank,
          accountNumber: paymentConfig.room.accountNumber,
          accountName: paymentConfig.room.accountName,
          amount: data.totalAmount,
          description: `P${data.roomCode} TT THANG ${cleanMonth}`,
        })
      : null;

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
              <td className="border-r border-black p-1.5 font-medium">1- Tiền thuê</td>
              <td className="border-r border-black p-1.5 text-slate-500 italic"></td>
              <td className="border-r border-black p-1.5 text-right font-medium whitespace-nowrap">
                {formatVND(data.basePrice)} đ
              </td>
              <td className="border-r border-black p-1.5 text-center">1</td>
              <td className="p-1.5 text-right font-bold pr-2 whitespace-nowrap">
                {formatVND(data.basePrice)} đ
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

            {/* 5. Discount if any */}
            {data.discount !== undefined && data.discount > 0 && (
              <tr className="bg-emerald-50/70">
                <td className="border-r border-black p-1.5 font-bold text-emerald-800">5- Giảm giá / Ưu đãi</td>
                <td className="border-r border-black p-1.5 text-[11px] text-emerald-800 italic">
                  {data.discountReason || "Khuyến mãi / Event giảm giá"}
                </td>
                <td className="border-r border-black p-1.5 text-right font-bold text-emerald-700 whitespace-nowrap">
                  -{formatVND(data.discount)} đ
                </td>
                <td className="border-r border-black p-1.5 text-center font-bold text-emerald-700">1</td>
                <td className="p-1.5 text-right font-bold text-emerald-700 pr-2 whitespace-nowrap">
                  -{formatVND(data.discount)} đ
                </td>
              </tr>
            )}

            {/* TOTAL ROW */}
            <tr className="border-t-2 border-black font-extrabold text-[13px]">
              <td colSpan={4} className="border-r border-black p-2 text-center uppercase tracking-wider bg-white">
                Tổng cộng
              </td>
              <td className="p-2 text-right text-base font-black text-rose-700 bg-[#FFF2CC] pr-2 whitespace-nowrap">
                {formatVND(data.totalAmount)} đ
              </td>
            </tr>

            {/* NOTE ROW */}
            <tr>
              <td className="border-r border-black p-2 font-bold italic">Ghi chú:</td>
              <td colSpan={4} className="p-2 text-xs text-slate-700 font-medium whitespace-pre-line leading-relaxed">
                {data.receiptNote || "Vui lòng thanh toán đúng hạn trước ngày 05 hàng tháng. Xin cảm ơn!"}
              </td>
            </tr>
          </tbody>
        </table>

        {/* VietQR Payment Section (Anti-Scan Collision Design) */}
        {hasAccount && (
          <div className="mt-3 pt-2.5 border-t-2 border-black">
            {isSplit ? (
              /* DUAL QR MODE: Vertical Stacking with Safe Physical Clearance (Anti-Collision) */
              <div className="space-y-3">
                <div className="text-center">
                  <div className="text-[11px] font-black uppercase tracking-wider text-slate-800">
                    QUÉT MÃ VIETQR THANH TOÁN (TÁCH RIÊNG 2 KHOẢN)
                  </div>
                  <p className="text-[10px] text-slate-500 italic mt-0.5">
                    Vui lòng quét Bước 1 trước, sau đó kéo máy xuống để quét Bước 2
                  </p>
                </div>

                {/* Card 1: Tiền phòng (Top Card - Xanh Dương) */}
                <div className="border-2 border-blue-600 rounded-xl p-2.5 bg-[#f0f7ff] shadow-xs">
                  <div className="bg-blue-600 text-white font-extrabold text-[11px] uppercase py-1 px-2.5 rounded-md tracking-wider flex items-center justify-between mb-2">
                    <span className="flex items-center gap-1.5">
                      <span>🏠 BƯỚC 1: THANH TOÁN TIỀN THUÊ PHÒNG</span>
                    </span>
                    <span className="text-[10px] font-normal opacity-90">Quét mã này trước</span>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    {/* Left: Detailed text info */}
                    <div className="flex-1 min-w-0 space-y-1 text-left">
                      <div className="text-xs text-slate-500 font-semibold">Số tiền cần chuyển:</div>
                      <div className="text-lg font-black text-blue-700 leading-none">
                        {formatVND(roomAmount)} đ
                      </div>
                      <div className="text-[11px] text-slate-800 space-y-0.5 pt-1">
                        <div>Ngân hàng: <strong>{getBankDisplayName(paymentConfig.room.bank)}</strong></div>
                        <div className="font-mono">STK: <strong className="text-blue-900 bg-blue-100/80 px-1 py-0.5 rounded-sm">{paymentConfig.room.accountNumber}</strong></div>
                        {paymentConfig.room.accountName && (
                          <div className="truncate uppercase text-slate-700">Chủ TK: <strong>{paymentConfig.room.accountName}</strong></div>
                        )}
                        <div className="text-blue-900 font-semibold bg-blue-100/90 px-1.5 py-0.5 rounded-sm text-[10px] inline-block mt-0.5">
                          Cú pháp: P{data.roomCode} TIEN PHONG {cleanMonth}
                        </div>
                      </div>
                    </div>

                    {/* Right: VietQR Code */}
                    {roomQrUrl && (
                      <div className="shrink-0 text-center">
                        <div className="bg-white p-1.5 rounded-lg border-2 border-blue-200 inline-block shadow-xs">
                          <img
                            src={roomQrUrl}
                            alt="QR Tiền phòng"
                            crossOrigin="anonymous"
                            className="w-[112px] h-[112px] object-contain block"
                          />
                        </div>
                        <div className="text-[9.5px] font-bold text-blue-700 mt-0.5">Mã QR Tiền Phòng</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Safety Buffer & Transition Divider */}
                <div className="relative flex items-center justify-center my-1">
                  <div className="border-t-2 border-dashed border-slate-300 w-full"></div>
                  <div className="absolute bg-white px-3 py-0.5 rounded-full border border-slate-300 text-[9.5px] font-bold text-slate-500 flex items-center gap-1 shadow-2xs">
                    <span>✂️ Kéo máy xuống quét tiền điện nước</span>
                    <span>⬇️</span>
                  </div>
                </div>

                {/* Card 2: Tiền điện nước (Bottom Card - Cam Hổ Phách) */}
                <div className="border-2 border-amber-600 rounded-xl p-2.5 bg-[#fffaf5] shadow-xs">
                  <div className="bg-amber-600 text-white font-extrabold text-[11px] uppercase py-1 px-2.5 rounded-md tracking-wider flex items-center justify-between mb-2">
                    <span className="flex items-center gap-1.5">
                      <span>⚡💧 BƯỚC 2: THANH TOÁN TIỀN ĐIỆN & NƯỚC</span>
                    </span>
                    <span className="text-[10px] font-normal opacity-90">Quét mã này sau</span>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    {/* Left: Detailed text info */}
                    <div className="flex-1 min-w-0 space-y-1 text-left">
                      <div className="text-xs text-slate-500 font-semibold">Số tiền cần chuyển:</div>
                      <div className="text-lg font-black text-amber-700 leading-none">
                        {formatVND(utilityAmount)} đ
                      </div>
                      <div className="text-[11px] text-slate-800 space-y-0.5 pt-1">
                        <div>Ngân hàng: <strong>{getBankDisplayName(paymentConfig.service.bank)}</strong></div>
                        <div className="font-mono">STK: <strong className="text-amber-900 bg-amber-100/80 px-1 py-0.5 rounded-sm">{paymentConfig.service.accountNumber}</strong></div>
                        {paymentConfig.service.accountName && (
                          <div className="truncate uppercase text-slate-700">Chủ TK: <strong>{paymentConfig.service.accountName}</strong></div>
                        )}
                        <div className="text-amber-900 font-semibold bg-amber-100/90 px-1.5 py-0.5 rounded-sm text-[10px] inline-block mt-0.5">
                          Cú pháp: P{data.roomCode} DIEN NUOC {cleanMonth}
                        </div>
                      </div>
                    </div>

                    {/* Right: VietQR Code */}
                    {serviceQrUrl && (
                      <div className="shrink-0 text-center">
                        <div className="bg-white p-1.5 rounded-lg border-2 border-amber-200 inline-block shadow-xs">
                          <img
                            src={serviceQrUrl}
                            alt="QR Tiền điện nước"
                            crossOrigin="anonymous"
                            className="w-[112px] h-[112px] object-contain block"
                          />
                        </div>
                        <div className="text-[9.5px] font-bold text-amber-700 mt-0.5">Mã QR Điện Nước</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              /* SINGLE QR MODE: 1 Unified Account for Total Amount */
              <div className="max-w-[300px] mx-auto border-2 border-black rounded-lg p-2.5 bg-slate-50 text-center shadow-2xs">
                <div className="bg-slate-900 text-white font-extrabold text-[11px] uppercase py-1 px-2 rounded-xs tracking-wide mb-1.5">
                  QUÉT MÃ VIETQR THANH TOÁN
                </div>

                {singleQrUrl && (
                  <div className="bg-white p-1 rounded-sm border border-slate-300 inline-block shadow-2xs mx-auto mb-1">
                    <img
                      src={singleQrUrl}
                      alt="Mã VietQR thanh toán"
                      crossOrigin="anonymous"
                      className="w-[120px] h-[120px] object-contain mx-auto block"
                    />
                  </div>
                )}

                <div className="text-base font-black text-rose-700 mt-0.5">
                  {formatVND(data.totalAmount)} đ
                </div>

                <div className="mt-1.5 pt-1.5 border-t border-slate-200 text-[10.5px] text-slate-700 space-y-0.5 text-left">
                  <div>Ngân hàng: <strong>{getBankDisplayName(paymentConfig.room.bank)}</strong></div>
                  <div className="font-mono">STK: <strong>{paymentConfig.room.accountNumber}</strong></div>
                  {paymentConfig.room.accountName && (
                    <div className="truncate uppercase">Chủ TK: <strong>{paymentConfig.room.accountName}</strong></div>
                  )}
                  <div className="text-slate-900 font-semibold bg-slate-200/90 px-1.5 py-0.5 rounded-xs text-[9.5px] truncate">
                    Cú pháp: P{data.roomCode} TT THANG {cleanMonth}
                  </div>
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
