import { ProductShell } from "@/components/product-shell";

export default function PlayerLayout({ children }: { children: React.ReactNode }) {
  return <ProductShell>{children}</ProductShell>;
}
