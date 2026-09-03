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
        <main className="flex-1 w-full max-w-[1720px] 2xl:max-w-[1840px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 pt-4 sm:pt-6 pb-24 md:pb-12">
          {children}
        </main>
        <BottomNav />
      </div>
    </ToastProvider>
  );
}
