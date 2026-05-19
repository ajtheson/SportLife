"use client";

import { useState } from "react";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { buttonVariants } from "@/components/ui/button";

type MobileSidebarProps = {
  children: React.ReactNode;
};

export function MobileSidebar({ children }: MobileSidebarProps) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        className={buttonVariants({ variant: "ghost", size: "icon" })}
        aria-label="Mở menu"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
        </svg>
      </SheetTrigger>
      <SheetContent side="left" className="w-[280px] p-0" onClick={() => setOpen(false)}>
        <SheetTitle className="sr-only">Menu điều hướng</SheetTitle>
        {children}
      </SheetContent>
    </Sheet>
  );
}
