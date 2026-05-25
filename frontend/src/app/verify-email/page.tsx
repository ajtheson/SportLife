import Link from "next/link";
import { verifyEmailToken } from "@/features/auth/auth-service";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

type VerifyEmailPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function VerifyEmailPage({ searchParams }: VerifyEmailPageProps) {
  const token = (await searchParams).token;
  const result = typeof token === "string" ? await verifyEmailToken(token) : { ok: false };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6 py-12">
      <Card className={result.ok ? "border-primary/20 bg-primary/5" : "border-destructive/20 bg-destructive/5"}>
        <CardHeader>
          <CardTitle className="text-2xl">
            {result.ok ? "Xác thực email thành công" : "Xác thực không thành công"}
          </CardTitle>
          <CardDescription>
            {result.ok
              ? "Tài khoản của bạn đã được kích hoạt. Bạn có thể đăng nhập ngay bây giờ."
              : "Liên kết xác thực này không hợp lệ, đã hết hạn hoặc đã được sử dụng."}
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Link className={buttonVariants({ className: "w-full" })} href="/login">
            Đến trang đăng nhập
          </Link>
        </CardFooter>
      </Card>
    </main>
  );
}
