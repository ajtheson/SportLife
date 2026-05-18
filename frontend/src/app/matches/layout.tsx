import { ProductShell } from "@/components/product-shell";

export default function MatchesLayout({ children }: { children: React.ReactNode }) {
  return <ProductShell>{children}</ProductShell>;
}
