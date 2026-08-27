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
      <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-sky-500 selection:text-white">
        <Header />
        <main className="flex-1 w-full max-w-lg mx-auto px-4 pt-4 pb-24">
          {children}
        </main>
        <BottomNav />
      </div>
    </ToastProvider>
  );
}
