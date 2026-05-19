import Link from "next/link";
import { forgotPasswordAction } from "@/features/auth/auth-actions";
import { authMessage } from "@/features/auth/auth-messages";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

type ForgotPasswordPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ForgotPasswordPage({ searchParams }: ForgotPasswordPageProps) {
  const message = authMessage(await searchParams);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6 py-12">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Khôi phục mật khẩu</CardTitle>
          <CardDescription>Nhập email tài khoản của bạn và chúng tôi sẽ gửi liên kết khôi phục.</CardDescription>
        </CardHeader>
        <CardContent>
          {message ? (
            <div className="mb-6 rounded-md border border-border bg-muted p-4 text-sm text-foreground">{message}</div>
          ) : null}

          <form action={forgotPasswordAction} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
              />
            </div>

            <Button type="submit" className="w-full">
              Gửi liên kết
            </Button>
          </form>
        </CardContent>
        <CardFooter>
          <Link className="text-sm font-medium text-primary hover:underline" href="/login">
            Quay lại trang đăng nhập
          </Link>
        </CardFooter>
      </Card>
    </main>
  );
}
