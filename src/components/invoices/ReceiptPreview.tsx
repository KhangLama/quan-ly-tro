"use client";

import React, {
  forwardRef,
  useImperativeHandle,
  useRef,
  useState,
  useEffect,
  useCallback,
} from "react";
import { toPng, toBlob } from "html-to-image";
import {
  ReceiptCanvas,
  type ReceiptData,
  type QrDisplayFilter,
} from "./ReceiptCanvas";
import { parsePaymentAccounts } from "@/lib/vietqr";
import {
  Maximize2,
  ZoomIn,
  ZoomOut,
  Smartphone,
  Sparkles,
  RotateCcw,
  QrCode,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface ReceiptPreviewRef {
  captureBlob: () => Promise<Blob>;
  capturePng: () => Promise<string>;
  getExportNode: () => HTMLDivElement | null;
  getQrFilter: () => QrDisplayFilter;
  setQrFilter: (filter: QrDisplayFilter) => void;
}

export interface ReceiptPreviewProps {
  data: ReceiptData | null;
  className?: string;
  maxHeight?: string;
}

async function waitForImagesAndFonts(node: HTMLElement) {
  if (typeof document !== "undefined" && document.fonts?.ready) {
    try {
      await document.fonts.ready;
    } catch {
      // Ignore font loading errors
    }
  }

  const images = Array.from(node.querySelectorAll("img"));
  if (images.length > 0) {
    await Promise.all(
      images.map(async (img) => {
        if (!img.complete) {
          await new Promise((resolve) => {
            img.onload = () => resolve(null);
            img.onerror = () => resolve(null);
          });
        }
        if (typeof img.decode === "function") {
          try {
            await img.decode();
          } catch {
            // Ignore decode errors
          }
        }
      })
    );
  }
}

export const ReceiptPreview = forwardRef<ReceiptPreviewRef, ReceiptPreviewProps>(
  ({ data, className, maxHeight = "65vh" }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const previewWrapperRef = useRef<HTMLDivElement>(null);
    const exportRef = useRef<HTMLDivElement>(null);

    const [qrFilter, setQrFilter] = useState<QrDisplayFilter>("all");

    // Initial container width estimation
    const [containerWidth, setContainerWidth] = useState<number>(() => {
      if (typeof window !== "undefined") {
        return Math.min(window.innerWidth - 32, 580);
      }
      return 580;
    });

    const [receiptHeight, setReceiptHeight] = useState<number>(680);
    const [mode, setMode] = useState<"fit" | "full" | "custom">("fit");
    const [customScale, setCustomScale] = useState<number>(1);

    // Measure container width responsively
    useEffect(() => {
      const el = containerRef.current;
      if (!el) return;

      const updateWidth = () => {
        if (el) {
          const w = el.clientWidth;
          if (w > 0) setContainerWidth(w);
        }
      };

      updateWidth();

      if (typeof ResizeObserver !== "undefined") {
        const observer = new ResizeObserver((entries) => {
          for (const entry of entries) {
            if (entry.contentRect && entry.contentRect.width > 0) {
              setContainerWidth(entry.contentRect.width);
            }
          }
        });
        observer.observe(el);
        return () => observer.disconnect();
      } else {
        window.addEventListener("resize", updateWidth);
        return () => window.removeEventListener("resize", updateWidth);
      }
    }, []);

    // Measure natural height of receipt preview whenever data or qrFilter changes
    useEffect(() => {
      const measureHeight = () => {
        if (previewWrapperRef.current) {
          const h = previewWrapperRef.current.offsetHeight;
          if (h > 0) setReceiptHeight(h);
        }
      };

      measureHeight();
      const timer = setTimeout(measureHeight, 100);
      return () => clearTimeout(timer);
    }, [data, qrFilter]);

    // Calculate fit scale based on available container width
    const padding = 20;
    const availableWidth = Math.max(280, containerWidth - padding);
    const fitScale = Math.min(1, Math.max(0.35, availableWidth / 580));

    // Determine current active scale
    const currentScale =
      mode === "fit" ? fitScale : mode === "full" ? 1 : customScale;

    // Zoom handlers
    const handleZoomIn = useCallback(() => {
      setMode("custom");
      setCustomScale((prev) => Math.min(1.4, Number((prev + 0.1).toFixed(2))));
    }, []);

    const handleZoomOut = useCallback(() => {
      setMode("custom");
      setCustomScale((prev) => Math.max(0.4, Number((prev - 0.1).toFixed(2))));
    }, []);

    const handleReset = useCallback(() => {
      if (containerWidth < 600) {
        setMode("fit");
      } else {
        setMode("full");
      }
      setCustomScale(1);
    }, [containerWidth]);

    // Expose capture methods that ALWAYS capture the pristine, unscaled, unclipped exportRef
    useImperativeHandle(
      ref,
      () => ({
        captureBlob: async (): Promise<Blob> => {
          const node = exportRef.current;
          if (!node) {
            throw new Error("Không tìm thấy canvas biên lai để xuất ảnh");
          }

          await waitForImagesAndFonts(node);

          const targetWidth = 580;
          const targetHeight = Math.max(
            node.scrollHeight,
            node.offsetHeight,
            node.clientHeight,
            600
          );

          const blob = await toBlob(node, {
            quality: 1,
            pixelRatio: 2.5,
            backgroundColor: "#ffffff",
            width: targetWidth,
            height: targetHeight,
            style: {
              position: "static",
              left: "0px",
              top: "0px",
              margin: "0px",
              transform: "none",
              width: `${targetWidth}px`,
              minWidth: `${targetWidth}px`,
              maxWidth: `${targetWidth}px`,
              boxSizing: "border-box",
            },
          });

          if (!blob) {
            throw new Error("Không thể tạo dữ liệu ảnh biên lai (blob rỗng)");
          }

          return blob;
        },

        capturePng: async (): Promise<string> => {
          const node = exportRef.current;
          if (!node) {
            throw new Error("Không tìm thấy canvas biên lai để xuất ảnh");
          }

          await waitForImagesAndFonts(node);

          const targetWidth = 580;
          const targetHeight = Math.max(
            node.scrollHeight,
            node.offsetHeight,
            node.clientHeight,
            600
          );

          const dataUrl = await toPng(node, {
            quality: 1,
            pixelRatio: 2.5,
            backgroundColor: "#ffffff",
            width: targetWidth,
            height: targetHeight,
            style: {
              position: "static",
              left: "0px",
              top: "0px",
              margin: "0px",
              transform: "none",
              width: `${targetWidth}px`,
              minWidth: `${targetWidth}px`,
              maxWidth: `${targetWidth}px`,
              boxSizing: "border-box",
            },
          });

          return dataUrl;
        },

        getExportNode: () => exportRef.current,
        getQrFilter: () => qrFilter,
        setQrFilter: (f: QrDisplayFilter) => setQrFilter(f),
      }),
      [qrFilter]
    );

    if (!data) {
      return (
        <div
          className={cn(
            "p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl border border-slate-200/80",
            className
          )}
        >
          Vui lòng chọn phòng để hiển thị biên lai
        </div>
      );
    }

    const paymentConfig = data.paymentConfig || parsePaymentAccounts(data.bankInfo);
    const isSplit = Boolean(
      paymentConfig.split &&
        paymentConfig.room.accountNumber &&
        paymentConfig.service.accountNumber
    );

    const isScaled = currentScale < 0.999;
    const isSmallScreen = containerWidth < 620;

    return (
      <div className={cn("space-y-2", className)}>
        {/* QR Display Mode Selector (when Dual Account Split is enabled) */}
        {isSplit && (
          <div className="bg-indigo-50/70 border border-indigo-200/80 rounded-xl p-2 space-y-1.5">
            <div className="flex items-center justify-between gap-2 text-[11px] font-bold text-indigo-950">
              <span className="flex items-center gap-1.5">
                <QrCode className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                <span>Chế độ mã QR trên ảnh biên lai:</span>
              </span>
              <span className="text-[10px] font-medium text-indigo-700 hidden sm:inline">
                Chọn 1 mã nếu khách quét bằng ảnh từ thư viện App Bank
              </span>
            </div>

            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => setQrFilter("all")}
                className={cn(
                  "px-2 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer border text-center",
                  qrFilter === "all"
                    ? "bg-slate-900 text-white border-slate-900 shadow-2xs"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                )}
              >
                Cả 2 mã (So-le)
              </button>
              <button
                type="button"
                onClick={() => setQrFilter("room")}
                className={cn(
                  "px-2 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer border text-center",
                  qrFilter === "room"
                    ? "bg-blue-600 text-white border-blue-600 shadow-2xs"
                    : "bg-white text-blue-700 border-blue-200 hover:bg-blue-50"
                )}
              >
                Chỉ QR 1 (Tiền phòng)
              </button>
              <button
                type="button"
                onClick={() => setQrFilter("service")}
                className={cn(
                  "px-2 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer border text-center",
                  qrFilter === "service"
                    ? "bg-amber-600 text-white border-amber-600 shadow-2xs"
                    : "bg-white text-amber-800 border-amber-200 hover:bg-amber-50"
                )}
              >
                Chỉ QR 2 (Điện nước)
              </button>
            </div>
          </div>
        )}

        {/* Controls Toolbar */}
        <div className="flex items-center justify-between gap-2 px-2.5 py-1.5 bg-slate-100/90 rounded-xl border border-slate-200/90 text-xs shadow-2xs select-none">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-[11px] font-bold text-slate-700 truncate">
              Xem trước
            </span>
            <span
              className={cn(
                "px-1.5 py-0.5 rounded-md text-[10px] font-extrabold",
                isScaled
                  ? "bg-amber-100 text-amber-800 border border-amber-200"
                  : "bg-indigo-100 text-indigo-700 border border-indigo-200"
              )}
            >
              {Math.round(currentScale * 100)}%
            </span>
          </div>

          {/* Quick preset & zoom buttons */}
          <div className="flex items-center gap-1 shrink-0">
            {isSmallScreen && (
              <div className="flex items-center bg-white p-0.5 rounded-lg border border-slate-200 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setMode("fit")}
                  className={cn(
                    "px-2 py-0.5 rounded-md text-[11px] font-bold flex items-center gap-1 transition-all",
                    mode === "fit"
                      ? "bg-indigo-600 text-white shadow-2xs"
                      : "text-slate-600 hover:text-slate-900"
                  )}
                  title="Tự động thu nhỏ vừa khít màn hình"
                >
                  <Smartphone className="w-3 h-3" />
                  <span>Vừa màn hình</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMode("full")}
                  className={cn(
                    "px-2 py-0.5 rounded-md text-[11px] font-bold flex items-center gap-1 transition-all",
                    mode === "full"
                      ? "bg-indigo-600 text-white shadow-2xs"
                      : "text-slate-600 hover:text-slate-900"
                  )}
                  title="Kích thước gốc 100% (có thể cuộn ngang)"
                >
                  <Maximize2 className="w-3 h-3" />
                  <span>100% (Gốc)</span>
                </button>
              </div>
            )}

            {/* Micro Zoom Buttons */}
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={handleZoomOut}
                disabled={currentScale <= 0.4}
                className="p-1 rounded-md text-slate-600 hover:bg-white hover:text-slate-900 border border-transparent hover:border-slate-200 disabled:opacity-40 transition-colors"
                title="Thu nhỏ xem trước"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleZoomIn}
                disabled={currentScale >= 1.4}
                className="p-1 rounded-md text-slate-600 hover:bg-white hover:text-slate-900 border border-transparent hover:border-slate-200 disabled:opacity-40 transition-colors"
                title="Phóng to xem trước"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              {mode === "custom" && (
                <button
                  type="button"
                  onClick={handleReset}
                  className="p-1 rounded-md text-slate-600 hover:bg-white hover:text-slate-900 border border-transparent hover:border-slate-200 transition-colors"
                  title="Đặt lại kích thước mặc định"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Scrollable Receipt Preview Container */}
        <div
          ref={containerRef}
          className="relative overflow-x-auto overflow-y-auto p-2 sm:p-3 rounded-2xl border border-slate-200/90 bg-slate-100 shadow-inner"
          style={{ maxHeight }}
        >
          {isScaled ? (
            /* Scaled Mode: Outer box sized to exact scaled dimensions, inner element scaled with CSS transform */
            <div
              className="mx-auto overflow-hidden transition-[width,height] duration-150"
              style={{
                width: `${Math.round(580 * currentScale)}px`,
                height: `${Math.round(receiptHeight * currentScale)}px`,
              }}
            >
              <div
                style={{
                  width: "580px",
                  transform: `scale(${currentScale})`,
                  transformOrigin: "top left",
                }}
              >
                <div ref={previewWrapperRef}>
                  <ReceiptCanvas
                    data={data}
                    qrFilter={qrFilter}
                    id="receipt-canvas-preview"
                  />
                </div>
              </div>
            </div>
          ) : (
            /* 100% Unscaled Mode: Standard block flow starting at left coordinate */
            <div className="w-fit min-w-[580px] mx-auto">
              <div ref={previewWrapperRef}>
                <ReceiptCanvas
                  data={data}
                  qrFilter={qrFilter}
                  id="receipt-canvas-preview"
                />
              </div>
            </div>
          )}
        </div>

        {/* Quality Guarantee Note */}
        <div className="flex items-center justify-center gap-1.5 px-2 py-0.5 text-[11px] text-slate-500 text-center">
          <Sparkles className="w-3 h-3 text-amber-500 shrink-0" />
          <span>
            Mã QR được xuất chuẩn <strong>PNG độ tương phản cao (Quiet Zone 4 ô, không dính logo che tâm)</strong>, quét bằng ảnh 100% nhạy trên mọi App Ngân hàng.
          </span>
        </div>

        {/* Dedicated Off-Screen Pristine Canvas for Snapshot (100% Sharp & Unclipped) */}
        <div
          aria-hidden="true"
          className="pointer-events-none fixed"
          style={{
            position: "fixed",
            left: "-9999px",
            top: "0px",
            width: "580px",
            zIndex: -9999,
            opacity: 1,
            visibility: "visible",
          }}
        >
          <ReceiptCanvas
            ref={exportRef}
            data={data}
            qrFilter={qrFilter}
            id="receipt-canvas-export"
          />
        </div>
      </div>
    );
  }
);

ReceiptPreview.displayName = "ReceiptPreview";
