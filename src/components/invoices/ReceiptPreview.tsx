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
  StandaloneQrCard,
  resolveReceiptPayment,
  type ReceiptData,
} from "./ReceiptCanvas";
import {
  Maximize2,
  ZoomIn,
  ZoomOut,
  Smartphone,
  Sparkles,
  RotateCcw,
  Copy,
  Check,
  Download,
  Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type PreviewCardTab = "combo" | "receipt" | "roomQr" | "serviceQr";

export interface ReceiptPreviewRef {
  captureBlob: () => Promise<Blob>;
  capturePng: () => Promise<string>;
  captureComboFiles: (roomCode: string, month: string) => Promise<File[]>;
  downloadComboImages: (roomCode: string, month: string) => Promise<void>;
  isSplitMode: () => boolean;
  getExportNode: () => HTMLDivElement | null;
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

async function captureElementBlob(node: HTMLElement, targetWidth: number): Promise<Blob> {
  await waitForImagesAndFonts(node);
  const targetHeight = Math.max(
    node.scrollHeight,
    node.offsetHeight,
    node.clientHeight,
    380
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
    throw new Error("Không thể tạo dữ liệu ảnh (blob rỗng)");
  }
  return blob;
}

async function captureElementPng(node: HTMLElement, targetWidth: number): Promise<string> {
  await waitForImagesAndFonts(node);
  const targetHeight = Math.max(
    node.scrollHeight,
    node.offsetHeight,
    node.clientHeight,
    380
  );

  return toPng(node, {
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
}

export const ReceiptPreview = forwardRef<ReceiptPreviewRef, ReceiptPreviewProps>(
  ({ data, className, maxHeight = "65vh" }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const previewWrapperRef = useRef<HTMLDivElement>(null);

    // Off-screen pristine export refs
    const exportReceiptRef = useRef<HTMLDivElement>(null);
    const exportRoomQrRef = useRef<HTMLDivElement>(null);
    const exportServiceQrRef = useRef<HTMLDivElement>(null);

    const [activeTab, setActiveTab] = useState<PreviewCardTab>("combo");
    const [copiedTarget, setCopiedTarget] = useState<string | null>(null);
    const [busyTarget, setBusyTarget] = useState<string | null>(null);

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

    // Measure natural height of receipt preview
    useEffect(() => {
      const measureHeight = () => {
        if (previewWrapperRef.current) {
          const h = previewWrapperRef.current.offsetHeight;
          if (h > 0) setReceiptHeight(h);
        }
      };

      measureHeight();
      const timer = setTimeout(measureHeight, 120);
      return () => clearTimeout(timer);
    }, [data, activeTab]);

    const padding = 20;
    const availableWidth = Math.max(280, containerWidth - padding);
    const fitScale = Math.min(1, Math.max(0.35, availableWidth / 580));

    const currentScale =
      mode === "fit" ? fitScale : mode === "full" ? 1 : customScale;

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

    const paymentInfo = data ? resolveReceiptPayment(data) : null;
    const isSplit = Boolean(paymentInfo?.isSplit);

    // Helper to copy a single target ("receipt" | "roomQr" | "serviceQr")
    const handleCopySingle = async (target: "receipt" | "roomQr" | "serviceQr") => {
      try {
        setBusyTarget(target);
        const node =
          target === "roomQr"
            ? exportRoomQrRef.current
            : target === "serviceQr"
            ? exportServiceQrRef.current
            : exportReceiptRef.current;
        const width = target === "receipt" ? 580 : 440;
        if (!node) return;

        const blob = await captureElementBlob(node, width);
        if (blob && navigator.clipboard && (window as any).ClipboardItem) {
          await navigator.clipboard.write([
            new (window as any).ClipboardItem({ "image/png": blob }),
          ]);
          setCopiedTarget(target);
          setTimeout(() => setCopiedTarget(null), 2200);
        } else {
          await handleDownloadSingle(target);
        }
      } catch (err) {
        console.error("Copy single failed", err);
        await handleDownloadSingle(target);
      } finally {
        setBusyTarget(null);
      }
    };

    // Helper to download a single target ("receipt" | "roomQr" | "serviceQr")
    const handleDownloadSingle = async (target: "receipt" | "roomQr" | "serviceQr") => {
      if (!data) return;
      try {
        setBusyTarget(target);
        const node =
          target === "roomQr"
            ? exportRoomQrRef.current
            : target === "serviceQr"
            ? exportServiceQrRef.current
            : exportReceiptRef.current;
        const width = target === "receipt" ? 580 : 440;
        if (!node) return;

        const dataUrl = await captureElementPng(node, width);
        const fileName =
          target === "roomQr"
            ? `2_QR_Tien_Phong_${data.roomCode}_${data.month}.png`
            : target === "serviceQr"
            ? `3_QR_Dien_Nuoc_${data.roomCode}_${data.month}.png`
            : `1_Phieu_Tien_Phong_${data.roomCode}_${data.month}.png`;

        const link = document.createElement("a");
        link.download = fileName;
        link.href = dataUrl;
        link.click();
      } catch (err) {
        console.error("Download single failed", err);
      } finally {
        setBusyTarget(null);
      }
    };

    useImperativeHandle(
      ref,
      () => ({
        captureBlob: async (): Promise<Blob> => {
          if (isSplit && activeTab === "roomQr" && exportRoomQrRef.current) {
            return captureElementBlob(exportRoomQrRef.current, 440);
          }
          if (isSplit && activeTab === "serviceQr" && exportServiceQrRef.current) {
            return captureElementBlob(exportServiceQrRef.current, 440);
          }
          const node = exportReceiptRef.current;
          if (!node) {
            throw new Error("Không tìm thấy canvas biên lai để xuất ảnh");
          }
          return captureElementBlob(node, 580);
        },

        capturePng: async (): Promise<string> => {
          if (isSplit && activeTab === "roomQr" && exportRoomQrRef.current) {
            return captureElementPng(exportRoomQrRef.current, 440);
          }
          if (isSplit && activeTab === "serviceQr" && exportServiceQrRef.current) {
            return captureElementPng(exportServiceQrRef.current, 440);
          }
          const node = exportReceiptRef.current;
          if (!node) {
            throw new Error("Không tìm thấy canvas biên lai để xuất ảnh");
          }
          return captureElementPng(node, 580);
        },

        captureComboFiles: async (roomCode: string, month: string): Promise<File[]> => {
          const receiptNode = exportReceiptRef.current;
          if (!receiptNode) {
            throw new Error("Không tìm thấy canvas biên lai để xuất ảnh");
          }

          if (!isSplit) {
            const blob = await captureElementBlob(receiptNode, 580);
            return [
              new File([blob], `Phieu_Tien_Phong_${roomCode}_${month}.png`, {
                type: "image/png",
              }),
            ];
          }

          const files: File[] = [];
          const receiptBlob = await captureElementBlob(receiptNode, 580);
          files.push(
            new File([receiptBlob], `1_Phieu_Tien_Phong_${roomCode}_${month}.png`, {
              type: "image/png",
            })
          );

          if (exportRoomQrRef.current && (paymentInfo?.roomAmount || 0) > 0) {
            const roomQrBlob = await captureElementBlob(exportRoomQrRef.current, 440);
            files.push(
              new File([roomQrBlob], `2_QR_Tien_Phong_${roomCode}_${month}.png`, {
                type: "image/png",
              })
            );
          }

          if (exportServiceQrRef.current && (paymentInfo?.utilityAmount || 0) > 0) {
            const serviceQrBlob = await captureElementBlob(exportServiceQrRef.current, 440);
            files.push(
              new File([serviceQrBlob], `3_QR_Dien_Nuoc_${roomCode}_${month}.png`, {
                type: "image/png",
              })
            );
          }

          return files;
        },

        downloadComboImages: async (roomCode: string, month: string): Promise<void> => {
          const receiptNode = exportReceiptRef.current;
          if (!receiptNode) return;

          if (!isSplit) {
            const dataUrl = await captureElementPng(receiptNode, 580);
            const link = document.createElement("a");
            link.download = `Phieu_Tien_Phong_${roomCode}_${month}.png`;
            link.href = dataUrl;
            link.click();
            return;
          }

          const items: { name: string; url: string }[] = [];
          const receiptUrl = await captureElementPng(receiptNode, 580);
          items.push({
            name: `1_Phieu_Tien_Phong_${roomCode}_${month}.png`,
            url: receiptUrl,
          });

          if (exportRoomQrRef.current && (paymentInfo?.roomAmount || 0) > 0) {
            const roomUrl = await captureElementPng(exportRoomQrRef.current, 440);
            items.push({
              name: `2_QR_Tien_Phong_${roomCode}_${month}.png`,
              url: roomUrl,
            });
          }

          if (exportServiceQrRef.current && (paymentInfo?.utilityAmount || 0) > 0) {
            const serviceUrl = await captureElementPng(exportServiceQrRef.current, 440);
            items.push({
              name: `3_QR_Dien_Nuoc_${roomCode}_${month}.png`,
              url: serviceUrl,
            });
          }

          for (let i = 0; i < items.length; i++) {
            const link = document.createElement("a");
            link.download = items[i].name;
            link.href = items[i].url;
            link.click();
            if (i < items.length - 1) {
              await new Promise((r) => setTimeout(r, 220));
            }
          }
        },

        isSplitMode: () => isSplit,
        getExportNode: () => exportReceiptRef.current,
      }),
      [isSplit, activeTab, paymentInfo?.roomAmount, paymentInfo?.utilityAmount]
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

    const isScaled = currentScale < 0.999;
    const isSmallScreen = containerWidth < 620;

    return (
      <div className={cn("space-y-2", className)}>
        {/* Combo 3-Image Switcher & Quick Copy Bar when Dual Account Split is active */}
        {isSplit && (
          <div className="bg-indigo-50/70 border border-indigo-200/80 rounded-xl p-2 space-y-1.5">
            <div className="flex items-center justify-between gap-2 text-[11px] font-bold text-indigo-950">
              <span className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                <span>Bộ 3 Ảnh Thanh Toán (1 Phiếu + 2 Thẻ QR Rời):</span>
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              <button
                type="button"
                onClick={() => setActiveTab("combo")}
                className={cn(
                  "px-2 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer border text-center",
                  activeTab === "combo"
                    ? "bg-slate-900 text-white border-slate-900 shadow-2xs"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                )}
              >
                Xem cả 3 ảnh
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("receipt")}
                className={cn(
                  "px-2 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer border text-center",
                  activeTab === "receipt"
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-2xs"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                )}
              >
                1. Phiếu tiền phòng
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("roomQr")}
                className={cn(
                  "px-2 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer border text-center",
                  activeTab === "roomQr"
                    ? "bg-blue-600 text-white border-blue-600 shadow-2xs"
                    : "bg-white text-blue-700 border-blue-200 hover:bg-blue-50"
                )}
              >
                2. Thẻ QR Tiền Phòng
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("serviceQr")}
                className={cn(
                  "px-2 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer border text-center",
                  activeTab === "serviceQr"
                    ? "bg-amber-600 text-white border-amber-600 shadow-2xs"
                    : "bg-white text-amber-800 border-amber-200 hover:bg-amber-50"
                )}
              >
                3. Thẻ QR Điện Nước
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
                >
                  <Maximize2 className="w-3 h-3" />
                  <span>100% (Gốc)</span>
                </button>
              </div>
            )}

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
                <div ref={previewWrapperRef} className="space-y-4">
                  {/* Card 1: Receipt Table */}
                  {(!isSplit || activeTab === "combo" || activeTab === "receipt") && (
                    <div className="space-y-1.5">
                      {isSplit && (
                        <div className="flex items-center justify-between bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs">
                          <span className="text-xs font-extrabold text-slate-800">
                            📄 Ảnh 1/3: Phiếu Báo Tiền Phòng
                          </span>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleCopySingle("receipt")}
                              disabled={busyTarget !== null}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 cursor-pointer"
                            >
                              {copiedTarget === "receipt" ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                  <span className="text-emerald-700">Đã copy!</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5" />
                                  <span>Copy ảnh này</span>
                                </>
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDownloadSingle("receipt")}
                              disabled={busyTarget !== null}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 cursor-pointer"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>Tải riêng</span>
                            </button>
                          </div>
                        </div>
                      )}
                      <ReceiptCanvas data={data} id="receipt-canvas-preview" />
                    </div>
                  )}

                  {/* Card 2: Standalone Room QR */}
                  {isSplit && (activeTab === "combo" || activeTab === "roomQr") && (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-200 shadow-2xs max-w-[440px] mx-auto">
                        <span className="text-xs font-extrabold text-blue-900">
                          🟦 Ảnh 2/3: Thẻ QR Khoản 1 (Tiền Phòng)
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleCopySingle("roomQr")}
                            disabled={busyTarget !== null}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-white hover:bg-blue-100 text-blue-800 border border-blue-200 cursor-pointer"
                          >
                            {copiedTarget === "roomQr" ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                                <span className="text-emerald-700">Đã copy!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>Copy QR 1</span>
                              </>
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDownloadSingle("roomQr")}
                            disabled={busyTarget !== null}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-white hover:bg-blue-100 text-blue-800 border border-blue-200 cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Tải QR 1</span>
                          </button>
                        </div>
                      </div>
                      <StandaloneQrCard
                        data={data}
                        kind="room"
                        id="room-qr-card-preview"
                      />
                    </div>
                  )}

                  {/* Card 3: Standalone Service/Utility QR */}
                  {isSplit && (activeTab === "combo" || activeTab === "serviceQr") && (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200 shadow-2xs max-w-[440px] mx-auto">
                        <span className="text-xs font-extrabold text-amber-900">
                          🟧 Ảnh 3/3: Thẻ QR Khoản 2 (Điện & Nước)
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleCopySingle("serviceQr")}
                            disabled={busyTarget !== null}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-white hover:bg-amber-100 text-amber-900 border border-amber-200 cursor-pointer"
                          >
                            {copiedTarget === "serviceQr" ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                                <span className="text-emerald-700">Đã copy!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>Copy QR 2</span>
                              </>
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDownloadSingle("serviceQr")}
                            disabled={busyTarget !== null}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-white hover:bg-amber-100 text-amber-900 border border-amber-200 cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Tải QR 2</span>
                          </button>
                        </div>
                      </div>
                      <StandaloneQrCard
                        data={data}
                        kind="service"
                        id="service-qr-card-preview"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* 100% Unscaled Mode */
            <div className="w-fit min-w-[580px] mx-auto">
              <div ref={previewWrapperRef} className="space-y-4">
                {(!isSplit || activeTab === "combo" || activeTab === "receipt") && (
                  <div className="space-y-1.5">
                    {isSplit && (
                      <div className="flex items-center justify-between bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs">
                        <span className="text-xs font-extrabold text-slate-800">
                          📄 Ảnh 1/3: Phiếu Báo Tiền Phòng
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleCopySingle("receipt")}
                            disabled={busyTarget !== null}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 cursor-pointer"
                          >
                            {copiedTarget === "receipt" ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                                <span className="text-emerald-700">Đã copy!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>Copy ảnh này</span>
                              </>
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDownloadSingle("receipt")}
                            disabled={busyTarget !== null}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Tải riêng</span>
                          </button>
                        </div>
                      </div>
                    )}
                    <ReceiptCanvas data={data} id="receipt-canvas-preview" />
                  </div>
                )}

                {isSplit && (activeTab === "combo" || activeTab === "roomQr") && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-200 shadow-2xs max-w-[440px] mx-auto">
                      <span className="text-xs font-extrabold text-blue-900">
                        🟦 Ảnh 2/3: Thẻ QR Khoản 1 (Tiền Phòng)
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleCopySingle("roomQr")}
                          disabled={busyTarget !== null}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-white hover:bg-blue-100 text-blue-800 border border-blue-200 cursor-pointer"
                        >
                          {copiedTarget === "roomQr" ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              <span className="text-emerald-700">Đã copy!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copy QR 1</span>
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDownloadSingle("roomQr")}
                          disabled={busyTarget !== null}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-white hover:bg-blue-100 text-blue-800 border border-blue-200 cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Tải QR 1</span>
                        </button>
                      </div>
                    </div>
                    <StandaloneQrCard
                      data={data}
                      kind="room"
                      id="room-qr-card-preview"
                    />
                  </div>
                )}

                {isSplit && (activeTab === "combo" || activeTab === "serviceQr") && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200 shadow-2xs max-w-[440px] mx-auto">
                      <span className="text-xs font-extrabold text-amber-900">
                        🟧 Ảnh 3/3: Thẻ QR Khoản 2 (Điện & Nước)
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleCopySingle("serviceQr")}
                          disabled={busyTarget !== null}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-white hover:bg-amber-100 text-amber-900 border border-amber-200 cursor-pointer"
                        >
                          {copiedTarget === "serviceQr" ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              <span className="text-emerald-700">Đã copy!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copy QR 2</span>
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDownloadSingle("serviceQr")}
                          disabled={busyTarget !== null}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-white hover:bg-amber-100 text-amber-900 border border-amber-200 cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Tải QR 2</span>
                        </button>
                      </div>
                    </div>
                    <StandaloneQrCard
                      data={data}
                      kind="service"
                      id="service-qr-card-preview"
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Quality Guarantee Note */}
        <div className="flex items-center justify-center gap-1.5 px-2 py-0.5 text-[11px] text-slate-500 text-center">
          <Sparkles className="w-3 h-3 text-amber-500 shrink-0" />
          <span>
            Mỗi thẻ QR là <strong>1 ảnh độc lập duy nhất (280x280px)</strong> — Khách mở App Ngân hàng chọn ảnh từ thư viện quét chuẩn 100%.
          </span>
        </div>

        {/* Dedicated Off-Screen Pristine Canvases for Snapshot (100% Sharp & Unclipped) */}
        <div
          aria-hidden="true"
          className="pointer-events-none fixed"
          style={{
            position: "fixed",
            left: "-9999px",
            top: "0px",
            zIndex: -9999,
            opacity: 1,
            visibility: "visible",
          }}
        >
          <div style={{ width: "580px" }}>
            <ReceiptCanvas ref={exportReceiptRef} data={data} id="receipt-canvas-export" />
          </div>
          {isSplit && (
            <>
              <div style={{ width: "440px", marginTop: "20px" }}>
                <StandaloneQrCard
                  ref={exportRoomQrRef}
                  data={data}
                  kind="room"
                  id="room-qr-card-export"
                />
              </div>
              <div style={{ width: "440px", marginTop: "20px" }}>
                <StandaloneQrCard
                  ref={exportServiceQrRef}
                  data={data}
                  kind="service"
                  id="service-qr-card-export"
                />
              </div>
            </>
          )}
        </div>
      </div>
    );
  }
);

ReceiptPreview.displayName = "ReceiptPreview";
