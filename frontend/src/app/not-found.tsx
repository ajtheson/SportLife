import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
      <div className="flex size-16 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
        <svg xmlns="http://www.w3.org/2000/svg" className="size-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
        </svg>
      </div>
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">Không tìm thấy trang</h1>
        <p className="max-w-md text-muted-foreground">
          Trang bạn tìm kiếm không tồn tại hoặc đã bị di chuyển.
        </p>
      </div>
      <Link href="/" className={buttonVariants()}>
        Về trang chủ
      </Link>
    </div>
  );
}
