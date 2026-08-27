"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Building2, Eye, EyeOff, Lock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { loginAdmin } from "@/actions/auth";

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!password) {
      setError("Vui lòng nhập mật khẩu");
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      // First attempt via Server Action
      const result = await loginAdmin(password);
      if (result.success) {
        router.push("/");
        router.refresh();
        return;
      } else {
        setError(result.error || "Mật khẩu không chính xác");
      }
    } catch {
      // Fallback via API route if server action fails
      try {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password }),
        });
        const data = await res.json();
        if (res.ok && data.success) {
          router.push("/");
          router.refresh();
          return;
        } else {
          setError(data.message || "Mật khẩu không chính xác");
        }
      } catch {
        setError("Không thể kết nối đến máy chủ. Vui lòng thử lại.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-slate-50 to-slate-100 flex flex-col justify-center items-center px-4 py-8">
      <div className="w-full max-w-sm">
        {/* App Logo & Header */}
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-sky-600 flex items-center justify-center text-white shadow-lg shadow-sky-600/30 mb-3 animate-in zoom-in-95 duration-200">
            <Building2 className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Nhà trọ Trúc Lam
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Đăng nhập tài khoản quản trị
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-3xl p-6 shadow-xl shadow-slate-200/50 border border-slate-200/80">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Error Banner */}
            {error && (
              <div
                role="alert"
                className="flex items-start gap-2.5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium animate-in fade-in duration-150"
              >
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Password Input */}
            <div className="space-y-1.5">
              <label
                htmlFor="password"
                className="block text-xs font-semibold text-slate-700 uppercase tracking-wider"
              >
                Mật khẩu quản trị
              </label>
              <div className="relative rounded-xl shadow-xs">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="Nhập mật khẩu..."
                  autoComplete="current-password"
                  autoFocus
                  required
                  disabled={isLoading}
                  className="block w-full rounded-xl border border-slate-300 bg-white pl-10 pr-11 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 disabled:bg-slate-100 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                  aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 focus:outline-none"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              fullWidth
              size="lg"
              isLoading={isLoading}
              loadingText="Đang đăng nhập..."
              className="mt-2"
            >
              Đăng nhập
            </Button>
          </form>
        </div>

        {/* Footer info */}
        <div className="mt-8 text-center">
          <p className="text-xs text-slate-400">
            Hệ thống quản lý nội bộ nhà trọ 2026
          </p>
        </div>
      </div>
    </div>
  );
}
