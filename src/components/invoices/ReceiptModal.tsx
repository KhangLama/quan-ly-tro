"use client";

import React, { useRef, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Download, Check, Share2, Sparkles, Image as ImageIcon } from "lucide-react";
import { toPng, toBlob } from "html-to-image";
import { ReceiptCanvas, type ReceiptData } from "./ReceiptCanvas";

export type { ReceiptData };

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

  const handleDownloadImage = async () => {
    if (!receiptRef.current) return;
    try {
      setDownloading(true);
      const dataUrl = await toPng(receiptRef.current, {
        quality: 0.98,
        pixelRatio: 2,
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
        handleDownloadImage();
      }
    } catch (err) {
      console.error("Failed to copy image", err);
      handleDownloadImage();
    } finally {
      setDownloading(false);
    }
  };

  const handleShare = async () => {
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
          files: [file], // Only share the image file, no text
        });
      } else {
        await handleCopyImage();
        if (data.customerPhone) {
          const cleanPhone = data.customerPhone.replace(/\D/g, "");
          window.open(`https://zalo.me/${cleanPhone}`, "_blank");
        } else {
          alert("Đã sao chép ảnh biên lai vào bộ nhớ tạm! Bạn chỉ cần dán (Ctrl+V) vào khung chat người nhận.");
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
      description="Xem trước phiếu thu, gửi Zalo hoặc tải ảnh lưu trữ"
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
            <span>Share</span>
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
                <span>💬 Mở khung chat Zalo với {data.customerName || "khách"} ({data.customerPhone})</span>
              </a>
            </div>
          )}
        </div>

        {/* Scrollable Container for Receipt */}
        <div className="overflow-x-auto p-2 max-h-[68vh] overflow-y-auto rounded-2xl border border-slate-200/90 bg-slate-100/90 shadow-inner flex justify-center">
          <ReceiptCanvas ref={receiptRef} data={data} />
        </div>

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
