import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
      <h2 className="text-3xl font-extrabold text-slate-900">404</h2>
      <p className="text-sm text-slate-500 mt-2 mb-6">
        Không tìm thấy trang bạn yêu cầu
      </p>
      <Link href="/">
        <Button variant="primary">Về trang chủ</Button>
      </Link>
    </div>
  );
}
