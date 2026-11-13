"use client";

import React, { useState } from "react";
import {
  KeyRound,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { changeAdminPassword } from "@/actions/auth";

export function ChangePasswordCard() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!currentPassword.trim()) {
      setErrorMsg("Vui lòng nhập mật khẩu hiện tại.");
      return;
    }

    if (newPassword.length < 6) {
      setErrorMsg("Mật khẩu mới phải có tối thiểu 6 ký tự.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg("Mật khẩu xác nhận không khớp với mật khẩu mới.");
      return;
    }

    if (currentPassword === newPassword) {
      setErrorMsg("Mật khẩu mới phải khác mật khẩu hiện tại.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await changeAdminPassword(
        currentPassword,
        newPassword,
        confirmPassword
      );

      if (res.success) {
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setSuccessMsg(
          res.message || "Đổi mật khẩu quản trị viên thành công!"
        );
        setTimeout(() => setSuccessMsg(null), 5000);
      } else {
        setErrorMsg(res.error || "Không thể đổi mật khẩu. Vui lòng thử lại.");
      }
    } catch {
      setErrorMsg("Đã xảy ra lỗi kết nối. Vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="p-4 bg-white border-slate-200/80 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
            <KeyRound className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Bảo mật & Đổi mật khẩu Quản trị
            </h3>
            <p className="text-[11px] text-slate-500">
              Cập nhật mật khẩu đăng nhập hệ thống quản lý nhà trọ
            </p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 shrink-0">
          <ShieldCheck className="w-3 h-3" />
          <span>Admin Auth</span>
        </span>
      </div>

      {/* Feedback Alerts */}
      {errorMsg && (
        <div
          role="alert"
          className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-2xl flex items-center gap-2 animate-in fade-in"
        >
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div
          role="status"
          className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-2xl flex items-center gap-2 animate-in fade-in"
        >
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Password Form */}
      <form onSubmit={handleSubmit} className="space-y-3.5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {/* 1. Current Password */}
          <div>
            <label
              htmlFor="current-password"
              className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5"
            >
              <Lock className="w-3.5 h-3.5 text-slate-500" />
              <span>Mật khẩu hiện tại</span>
            </label>
            <Input
              id="current-password"
              name="current-password"
              type={showCurrent ? "text" : "password"}
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Nhập mật khẩu đang dùng"
              required
              disabled={submitting}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowCurrent((prev) => !prev)}
                  className="p-1 text-slate-400 hover:text-slate-600 focus:outline-hidden cursor-pointer"
                  aria-label={
                    showCurrent ? "Ẩn mật khẩu hiện tại" : "Hiện mật khẩu hiện tại"
                  }
                >
                  {showCurrent ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              }
            />
          </div>

          {/* 2. New Password */}
          <div>
            <label
              htmlFor="new-password"
              className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5"
            >
              <KeyRound className="w-3.5 h-3.5 text-indigo-600" />
              <span>Mật khẩu mới (tối thiểu 6 ký tự)</span>
            </label>
            <Input
              id="new-password"
              name="new-password"
              type={showNew ? "text" : "password"}
              autoComplete="new-password"
              minLength={6}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Nhập mật khẩu mới..."
              required
              disabled={submitting}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowNew((prev) => !prev)}
                  className="p-1 text-slate-400 hover:text-slate-600 focus:outline-hidden cursor-pointer"
                  aria-label={
                    showNew ? "Ẩn mật khẩu mới" : "Hiện mật khẩu mới"
                  }
                >
                  {showNew ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              }
            />
          </div>

          {/* 3. Confirm New Password */}
          <div>
            <label
              htmlFor="confirm-new-password"
              className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Xác nhận mật khẩu mới</span>
            </label>
            <Input
              id="confirm-new-password"
              name="confirm-new-password"
              type={showConfirm ? "text" : "password"}
              autoComplete="new-password"
              minLength={6}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Nhập lại mật khẩu mới..."
              required
              disabled={submitting}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowConfirm((prev) => !prev)}
                  className="p-1 text-slate-400 hover:text-slate-600 focus:outline-hidden cursor-pointer"
                  aria-label={
                    showConfirm
                      ? "Ẩn mật khẩu xác nhận"
                      : "Hiện mật khẩu xác nhận"
                  }
                >
                  {showConfirm ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              }
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 pt-1 border-t border-slate-100">
          <p className="text-[11px] text-slate-500">
            Mật khẩu mới sẽ có hiệu lực ngay lập tức cho các lần đăng nhập tiếp theo.
          </p>
          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={submitting}
            loadingText="Đang cập nhật..."
            leftIcon={<KeyRound className="w-4 h-4" />}
            className="sm:w-auto w-full"
          >
            Đổi mật khẩu
          </Button>
        </div>
      </form>
    </Card>
  );
}
