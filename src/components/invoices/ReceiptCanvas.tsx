import React, { forwardRef } from "react";
import { formatVND } from "@/lib/utils";

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
}

interface ReceiptCanvasProps {
  data: ReceiptData;
}

export const ReceiptCanvas = forwardRef<HTMLDivElement, ReceiptCanvasProps>(
  ({ data }, ref) => {
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

    return (
      <div
        ref={ref}
        id="receipt-canvas"
        className="bg-white text-slate-900 mx-auto p-4 sm:p-5 w-[580px] text-[13px] leading-snug font-sans select-none rounded-lg shadow-sm"
        style={{ minWidth: "580px" }}
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
                {data.receiptNote ? (
                  <div className="whitespace-pre-line">{data.receiptNote}</div>
                ) : data.bankInfo ? (
                  <div>
                    Thanh toán STK: <strong>{data.bankInfo}</strong> (Cú pháp: P{data.roomCode} TT thang {data.month})
                  </div>
                ) : (
                  "Vui lòng thanh toán trước ngày 05 hàng tháng. Xin cảm ơn!"
                )}
              </td>
            </tr>
          </tbody>
        </table>

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
