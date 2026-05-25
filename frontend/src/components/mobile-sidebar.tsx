"use client";

import { Menu } from "lucide-react";
import { useState } from "react";

import { buttonVariants } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

type MobileSidebarProps = {
  children: React.ReactNode;
};

export function MobileSidebar({ children }: MobileSidebarProps) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger className={buttonVariants({ variant: "ghost", size: "icon" })} aria-label="Mở menu">
        <Menu className="size-5" aria-hidden="true" />
      </SheetTrigger>
      <SheetContent side="left" className="w-[292px] p-0" onClick={() => setOpen(false)}>
        <SheetTitle className="sr-only">Menu điều hướng</SheetTitle>
        {children}
      </SheetContent>
    </Sheet>
  );
}
