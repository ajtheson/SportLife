"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

type AutoRefreshProps = {
  /** Khoảng thời gian giữa các lần refresh, mặc định 25 giây. */
  intervalMs?: number;
  /** Tắt polling khi cần. */
  enabled?: boolean;
};

const FORM_TAGS = ["INPUT", "TEXTAREA", "SELECT"];

/**
 * Tự động làm mới dữ liệu server component theo chu kỳ (giai đoạn trước realtime).
 * Dùng router.refresh() để re-fetch RSC tree với dữ liệu DB mới, không cần API route riêng.
 * Bỏ qua một nhịp khi tab đang ẩn (giảm tải DB) hoặc khi người dùng đang nhập liệu trong form.
 */
export function AutoRefresh({ intervalMs = 25000, enabled = true }: AutoRefreshProps) {
  const router = useRouter();

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const id = setInterval(() => {
      if (document.visibilityState !== "visible") {
        return;
      }

      const active = document.activeElement;
      if (active && FORM_TAGS.includes(active.tagName)) {
        return;
      }

      router.refresh();
    }, intervalMs);

    return () => clearInterval(id);
  }, [router, intervalMs, enabled]);

  return null;
}
