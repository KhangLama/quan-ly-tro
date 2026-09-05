"use client";

import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { updateRoomNote } from "@/actions/rooms";
import { StickyNote, Edit2, Check, X, Loader2 } from "lucide-react";

interface RoomNoteCardProps {
  roomId: string;
  roomCode: string;
  initialNote?: string;
  onNoteUpdated?: () => void;
}

export function RoomNoteCard({
  roomId,
  roomCode,
  initialNote = "",
  onNoteUpdated,
}: RoomNoteCardProps) {
  const { showToast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [note, setNote] = useState(initialNote);
  const [draftNote, setDraftNote] = useState(initialNote);
  const [saving, setSaving] = useState(false);

  // Load from initialNote and sync with localStorage fallback
  useEffect(() => {
    let activeNote = initialNote || "";
    if (!activeNote && typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem("room_note_" + roomId);
        if (cached) activeNote = cached;
      } catch {}
    }
    setNote(activeNote);
    setDraftNote(activeNote);
  }, [roomId, initialNote]);

  const handleStartEdit = () => {
    setDraftNote(note);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setDraftNote(note);
    setIsEditing(false);
  };

  const handleSave = async () => {
    setSaving(true);
    const cleanedNote = draftNote.trim();

    try {
      // 1. Cache to localStorage immediately for instant offline reliability
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("room_note_" + roomId, cleanedNote);
        } catch {}
      }

      // 2. Persist to database
      const res = await updateRoomNote(roomId, cleanedNote);
      if (!res.success && res.error) {
        showToast("Lỗi khi lưu ghi chú: " + res.error, "error");
      } else {
        setNote(cleanedNote);
        setIsEditing(false);
        showToast(`Đã lưu ghi chú cho phòng ${roomCode}`, "success");
        if (onNoteUpdated) onNoteUpdated();
      }
    } catch (err: any) {
      showToast("Lỗi khi lưu ghi chú: " + (err.message || "Không xác định"), "error");
    } finally {
      setSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Cmd+Enter or Ctrl+Enter to save quickly
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      handleSave();
    }
    // Escape to cancel
    if (e.key === "Escape") {
      e.preventDefault();
      handleCancel();
    }
  };

  return (
    <Card className="p-3.5 bg-white border-slate-200/80 shadow-xs flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 uppercase tracking-wider">
            <StickyNote className="w-4 h-4 text-amber-500" />
            <span>Ghi chú phòng {roomCode}</span>
          </div>

          {!isEditing && (
            <button
              type="button"
              onClick={handleStartEdit}
              className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition-colors"
            >
              <Edit2 className="w-3 h-3" />
              <span>{note ? "Sửa ghi chú" : "+ Thêm ghi chú"}</span>
            </button>
          )}
        </div>

        {/* Content Area */}
        <div className="pt-2">
          {isEditing ? (
            <div className="space-y-2">
              <textarea
                value={draftNote}
                onChange={(e) => setDraftNote(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={3}
                autoFocus
                placeholder="Nhập ghi chú riêng cho phòng này (ví dụ: đồ đạc gửi nhờ, khách hẹn cọc, thiết bị hư cần thợ...)"
                className="w-full text-xs rounded-xl border border-amber-300 bg-amber-50/20 p-2.5 text-slate-800 focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-hidden leading-relaxed resize-y min-h-[72px]"
              />
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-400">
                  Nhấn <kbd className="px-1 py-0.5 bg-slate-100 rounded text-[9px]">Ctrl</kbd> +{" "}
                  <kbd className="px-1 py-0.5 bg-slate-100 rounded text-[9px]">Enter</kbd> để lưu
                </span>
                <div className="flex items-center gap-1.5">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleCancel}
                    disabled={saving}
                    className="h-7 px-2.5 text-xs text-slate-600"
                  >
                    <X className="w-3 h-3 mr-1" />
                    Hủy
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleSave}
                    disabled={saving}
                    className="h-7 px-3 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
                  >
                    {saving ? (
                      <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                    ) : (
                      <Check className="w-3 h-3 mr-1" />
                    )}
                    Lưu
                  </Button>
                </div>
              </div>
            </div>
          ) : note ? (
            <div
              onClick={handleStartEdit}
              className="cursor-pointer group relative p-2.5 rounded-xl bg-amber-50/60 border border-amber-200/70 hover:border-amber-300 transition-colors"
              title="Bấm để chỉnh sửa ghi chú"
            >
              <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed font-medium">
                {note}
              </p>
              <span className="opacity-0 group-hover:opacity-100 text-[10px] text-amber-700 absolute right-2 bottom-1.5 transition-opacity">
                Bấm để sửa ✎
              </span>
            </div>
          ) : (
            <div
              onClick={handleStartEdit}
              className="cursor-pointer border border-dashed border-slate-200 hover:border-amber-300 hover:bg-amber-50/20 rounded-xl p-3 text-center transition-all"
            >
              <p className="text-xs text-slate-400 italic">
                Chưa có ghi chú nào cho phòng này. Bấm vào đây để thêm...
              </p>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
