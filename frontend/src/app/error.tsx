"use client";

import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
      <div className="flex size-16 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
        <svg xmlns="http://www.w3.org/2000/svg" className="size-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
        </svg>
      </div>
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">Đã xảy ra lỗi</h1>
        <p className="max-w-md text-muted-foreground">
          Rất tiếc, đã có lỗi không mong muốn xảy ra. Vui lòng thử lại hoặc quay về trang chủ.
        </p>
      </div>
      <div className="flex gap-3">
        <Button onClick={reset} variant="default">
          Thử lại
        </Button>
        <a href="/" className={buttonVariants({ variant: "outline" })}>
          Trang chủ
        </a>
      </div>
    </div>
  );
}
