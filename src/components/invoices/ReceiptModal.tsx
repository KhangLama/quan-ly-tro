"use client";

import React, { useRef, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Download, Check, Share2, Sparkles, Image as ImageIcon } from "lucide-react";
import { ReceiptPreview, type ReceiptPreviewRef } from "./ReceiptPreview";
import { resolveReceiptPayment, type ReceiptData } from "./ReceiptCanvas";

export type { ReceiptData };

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: ReceiptData | null;
}

export function ReceiptModal({ isOpen, onClose, data }: ReceiptModalProps) {
  const receiptPreviewRef = useRef<ReceiptPreviewRef>(null);
  const [downloading, setDownloading] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [copiedImage, setCopiedImage] = useState(false);

  if (!data) return null;

  const isSplit = resolveReceiptPayment(data).isSplit;

  const handleDownloadImage = async () => {
    if (!receiptPreviewRef.current) return;
    try {
      setDownloading(true);
      await receiptPreviewRef.current.downloadComboImages(data.roomCode, data.month);
    } catch (err) {
      console.error("Failed to generate image", err);
      alert("Không thể tạo ảnh biên lai. Vui lòng thử lại!");
    } finally {
      setDownloading(false);
    }
  };

  const handleCopyImage = async () => {
    if (!receiptPreviewRef.current) return;
    try {
      setDownloading(true);
      const blob = await receiptPreviewRef.current.captureBlob();
      if (blob && navigator.clipboard && (window as any).ClipboardItem) {
        await navigator.clipboard.write([
          new (window as any).ClipboardItem({ "image/png": blob }),
        ]);
        setCopiedImage(true);
        setTimeout(() => setCopiedImage(false), 2500);
      } else {
        await handleDownloadImage();
      }
    } catch (err) {
      console.error("Failed to copy image", err);
      await handleDownloadImage();
    } finally {
      setDownloading(false);
    }
  };

  const handleShare = async () => {
    if (!receiptPreviewRef.current) return;
    try {
      setSharing(true);
      const files = await receiptPreviewRef.current.captureComboFiles(
        data.roomCode,
        data.month
      );

      if (navigator.canShare && navigator.canShare({ files })) {
        await navigator.share({
          files,
        });
      } else {
        await handleDownloadImage();
        if (data.customerPhone) {
          const cleanPhone = data.customerPhone.replace(/\D/g, "");
          window.open(`https://zalo.me/${cleanPhone}`, "_blank");
        } else {
          alert(
            isSplit
              ? "Đã tải bộ 3 ảnh (1 Phiếu + 2 Thẻ QR) về máy! Bạn có thể đính kèm vào khung chat Zalo người nhận."
              : "Đã tải ảnh biên lai về máy!"
          );
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
      size="2xl"
      title={
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-500" />
          <span>Biên lai phiếu báo tiền phòng</span>
        </div>
      }
      description={
        isSplit
          ? "Combo 3 ảnh: 1 Phiếu báo tiền phòng + 2 Thẻ QR độc lập (quét bằng ảnh 100% chuẩn xác)"
          : "Xem trước phiếu thu, gửi Zalo hoặc tải ảnh lưu trữ"
      }
    >
      <div className="space-y-3.5">
        {/* Action Buttons */}
        <div className="space-y-2 bg-slate-50 p-2.5 rounded-2xl border border-slate-200/80">
          {/* Primary Share Button */}
          <Button
            type="button"
            onClick={handleShare}
            isLoading={sharing}
            className="w-full bg-[#0068FF] hover:bg-[#0055d4] text-white font-extrabold text-xs gap-2 h-11 shadow-sm shadow-blue-500/20 whitespace-nowrap"
          >
            <Share2 className="w-4 h-4 shrink-0" />
            <span>
              {isSplit ? "Chia sẻ Combo 3 ảnh (1 Phiếu + 2 QR)" : "Chia sẻ ảnh"}
            </span>
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
              <span>{isSplit ? "Tải trọn bộ 3 ảnh" : "Tải ảnh về máy"}</span>
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
                  <span className="text-emerald-700">Đã sao chép ảnh!</span>
                </>
              ) : (
                <>
                  <ImageIcon className="w-4 h-4 text-slate-500 shrink-0" />
                  <span>Sao chép ảnh đang xem</span>
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
                <span>
                  💬 Mở khung chat Zalo với {data.customerName || "khách"} ({data.customerPhone})
                </span>
              </a>
            </div>
          )}
        </div>

        {/* Responsive Receipt Preview */}
        <ReceiptPreview ref={receiptPreviewRef} data={data} maxHeight="62vh" />

        {/* Modal Footer */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-end">
          <Button variant="outline" onClick={onClose}>
            Đóng
          </Button>
        </div>
      </div>
    </Modal>
  );
}
