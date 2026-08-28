"use client";

import React, { useRef, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Download, Copy, Check, Share2, Sparkles, Image as ImageIcon } from "lucide-react";
import { toPng, toBlob } from "html-to-image";
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
  totalAmount: number;
}

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: ReceiptData | null;
}

export function ReceiptModal({ isOpen, onClose, data }: ReceiptModalProps) {
  const receiptRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [copiedImage, setCopiedImage] = useState(false);

  if (!data) return null;

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

  const handleDownloadImage = async () => {
    if (!receiptRef.current) return;
    try {
      setDownloading(true);
      const dataUrl = await toPng(receiptRef.current, {
        quality: 0.98,
        pixelRatio: 2, // High resolution for crisp text
        backgroundColor: "#ffffff",
      });
      const link = document.createElement("a");
      link.download = `Phieu_Tien_Phong_${data.roomCode}_${data.month}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Failed to generate image", err);
      alert("Không thể tạo ảnh biên lai. Vui lòng thử lại!");
    } finally {
      setDownloading(false);
    }
  };

  const handleCopyImage = async () => {
    if (!receiptRef.current) return;
    try {
      setDownloading(true);
      const blob = await toBlob(receiptRef.current, {
        quality: 0.98,
        pixelRatio: 2,
        backgroundColor: "#ffffff",
      });
      if (blob && navigator.clipboard && (window as any).ClipboardItem) {
        await navigator.clipboard.write([
          new (window as any).ClipboardItem({ "image/png": blob }),
        ]);
        setCopiedImage(true);
        setTimeout(() => setCopiedImage(false), 2500);
      } else {
        // Fallback to download if direct image clipboard is not supported
        handleDownloadImage();
      }
    } catch (err) {
      console.error("Failed to copy image", err);
      handleDownloadImage();
    } finally {
      setDownloading(false);
    }
  };

  const handleShareZalo = async () => {
    if (!receiptRef.current) return;
    try {
      setSharing(true);
      const blob = await toBlob(receiptRef.current, {
        quality: 0.98,
        pixelRatio: 2,
        backgroundColor: "#ffffff",
      });
      if (!blob) throw new Error("Could not generate image blob");

      const file = new File(
        [blob],
        `Phieu_Tien_Phong_${data.roomCode}_${data.month}.png`,
        { type: "image/png" }
      );

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: `Phiếu báo tiền phòng ${data.roomCode}`,
          text: `Phiếu báo tiền phòng ${data.roomCode} - Tháng ${data.month}: Tổng ${formatVND(data.totalAmount)}đ.`,
          files: [file],
        });
      } else if (navigator.share) {
        await navigator.share({
          title: `Phiếu báo tiền phòng ${data.roomCode}`,
          text: `Phiếu báo tiền phòng ${data.roomCode} - Tháng ${data.month}: Tổng ${formatVND(data.totalAmount)}đ.`,
        });
      } else {
        // Desktop fallback
        await handleCopyImage();
        if (data.customerPhone) {
          const cleanPhone = data.customerPhone.replace(/\D/g, "");
          window.open(`https://zalo.me/${cleanPhone}`, "_blank");
        } else {
          alert("Đã sao chép ảnh biên lai vào bộ nhớ tạm! Bạn chỉ cần dán (Ctrl+V) vào khung chat Zalo của khách.");
        }
      }
    } catch (err: any) {
      if (err?.name !== "AbortError") {
        console.error("Share failed", err);
      }
    } finally {
      setSharing(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-500" />
          <span>Biên lai phiếu báo tiền phòng</span>
        </div>
      }
      description="Xem trước phiếu thu, gửi Zalo hoặc tải ảnh lưu trữ"
    >
      <div className="space-y-3.5">
        {/* Action Buttons */}
        <div className="space-y-2 bg-slate-50 p-2.5 rounded-2xl border border-slate-200/80">
          {/* Primary Zalo Share Button */}
          <Button
            type="button"
            onClick={handleShareZalo}
            isLoading={sharing}
            className="w-full bg-[#0068FF] hover:bg-[#0055d4] text-white font-extrabold text-xs gap-2 h-11 shadow-sm shadow-blue-500/20 whitespace-nowrap"
          >
            <Share2 className="w-4 h-4 shrink-0" />
            <span>Chia sẻ qua Zalo (Gửi ảnh chọn người nhận)</span>
          </Button>

          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleDownloadImage}
              isLoading={downloading}
              className="w-full font-bold text-xs gap-1.5 h-10 text-slate-700 border-slate-300 hover:bg-white whitespace-nowrap"
            >
              <Download className="w-4 h-4 shrink-0 text-slate-600" />
              <span>Tải ảnh về máy</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={handleCopyImage}
              disabled={downloading || sharing}
              className="w-full font-bold text-xs gap-1.5 h-10 text-slate-700 border-slate-300 hover:bg-white whitespace-nowrap"
            >
              {copiedImage ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="text-emerald-700">Đã copy ảnh!</span>
                </>
              ) : (
                <>
                  <ImageIcon className="w-4 h-4 text-slate-500 shrink-0" />
                  <span>Copy ảnh biên lai</span>
                </>
              )}
            </Button>
          </div>

          {data.customerPhone && (
            <div className="pt-1 text-center">
              <a
                href={`https://zalo.me/${data.customerPhone.replace(/\D/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-[#0068FF] hover:underline font-semibold"
              >
                <span>💬 Mở khung chat Zalo với {customerName} ({data.customerPhone})</span>
              </a>
            </div>
          )}
        </div>

        {/* Scrollable Container for Receipt */}
        <div className="overflow-x-auto p-1 max-h-[60vh] overflow-y-auto rounded-xl border border-slate-200 bg-slate-100 shadow-inner">
          {/* THE RECEIPT CANVAS */}
          <div
            ref={receiptRef}
            id="receipt-canvas"
            className="bg-white text-slate-900 mx-auto p-4 sm:p-5 w-[580px] text-[13px] leading-snug font-sans select-none"
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
                  <td className="border-r border-black p-1.5 text-right font-medium whitespace-nowrap">{formatVND(data.basePrice)} đ</td>
                  <td className="border-r border-black p-1.5 text-center">1</td>
                  <td className="p-1.5 text-right font-bold pr-2 whitespace-nowrap">{formatVND(data.basePrice)} đ</td>
                </tr>

                {/* 2. Electricity */}
                <tr>
                  <td className="border-r border-black p-1.5 font-medium">2- Tiền điện</td>
                  <td className="border-r border-black p-1.5 text-[11px] text-slate-800 leading-normal">
                    <div>Chỉ số mới: <strong>{data.newElectric}</strong></div>
                    <div>Chỉ số cũ: <strong>{data.oldElectric}</strong></div>
                  </td>
                  <td className="border-r border-black p-1.5 text-right font-medium whitespace-nowrap">{formatVND(data.electricPrice)} đ</td>
                  <td className="border-r border-black p-1.5 text-center font-bold text-amber-700">{data.electricUsage}</td>
                  <td className="p-1.5 text-right font-bold pr-2 whitespace-nowrap">{formatVND(data.electricCost)} đ</td>
                </tr>

                {/* 3. Water */}
                <tr>
                  <td className="border-r border-black p-1.5 font-medium">3- Tiền nước</td>
                  <td className="border-r border-black p-1.5 text-[11px] text-slate-800 leading-normal">
                    <div>Chỉ số mới: <strong>{data.newWater}</strong></div>
                    <div>Chỉ số cũ: <strong>{data.oldWater}</strong></div>
                  </td>
                  <td className="border-r border-black p-1.5 text-right font-medium whitespace-nowrap">{formatVND(data.waterPrice)} đ</td>
                  <td className="border-r border-black p-1.5 text-center font-bold text-sky-700">{data.waterUsage}</td>
                  <td className="p-1.5 text-right font-bold pr-2 whitespace-nowrap">{formatVND(data.waterCost)} đ</td>
                </tr>

                {/* 4. Service */}
                <tr>
                  <td className="border-r border-black p-1.5 font-medium">4- Phí khác</td>
                  <td className="border-r border-black p-1.5 text-[11px] text-slate-600">
                    {data.serviceDescription || "Dịch vụ chung (Rác, Wifi, ...)"}
                  </td>
                  <td className="border-r border-black p-1.5 text-right font-medium whitespace-nowrap">{formatVND(data.servicePrice)} đ</td>
                  <td className="border-r border-black p-1.5 text-center">1</td>
                  <td className="p-1.5 text-right font-bold pr-2 whitespace-nowrap">{formatVND(data.servicePrice)} đ</td>
                </tr>

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
        </div>

        {/* Modal Close Button */}
        <div className="flex justify-end pt-2">
          <Button variant="outline" onClick={onClose}>
            Đóng
          </Button>
        </div>
      </div>
    </Modal>
  );
}
