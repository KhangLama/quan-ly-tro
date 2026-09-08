import * as React from "react";
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";
import { ToastProvider } from "@/components/ui/Toast";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ToastProvider>
      <div className="min-h-screen bg-gradient-to-b from-slate-50 via-slate-50 to-indigo-50/20 flex flex-col selection:bg-indigo-600 selection:text-white relative">
        {/* Ambient Top Glow */}
        <div
          aria-hidden="true"
          className="pointer-events-none fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-64 bg-gradient-to-b from-indigo-100/40 via-violet-50/20 to-transparent blur-3xl -z-10 opacity-70"
        />

        <Header />
        <main className="flex-1 w-full max-w-[1720px] 2xl:max-w-[1840px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 pt-4 sm:pt-6 pb-24 md:pb-12">
          {children}
        </main>
        <BottomNav />
      </div>
    </ToastProvider>
  );
}
