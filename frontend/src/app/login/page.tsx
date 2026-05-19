import Link from "next/link";

import { loginAction } from "@/features/auth/auth-actions";
import { authMessage } from "@/features/auth/auth-messages";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

type LoginPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const message = authMessage(await searchParams);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6 py-12">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Đăng nhập</CardTitle>
          <CardDescription>Sử dụng tài khoản SportLife đã xác thực của bạn.</CardDescription>
        </CardHeader>
        <CardContent>
          {message ? (
            <div className="mb-6 rounded-md border border-border bg-muted p-4 text-sm text-foreground">{message}</div>
          ) : null}

          <form action={loginAction} className="grid gap-4">
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

            <div className="grid gap-2">
              <Label htmlFor="password">Mật khẩu</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
              />
            </div>

            <Button type="submit" className="w-full">
              Đăng nhập
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Link className="text-sm font-medium text-primary hover:underline" href="/forgot-password">
            Quên mật khẩu?
          </Link>
          <div className="text-center text-sm text-muted-foreground">
            Chưa có tài khoản?{" "}
            <Link className="font-medium text-primary hover:underline" href="/register">
              Đăng ký
            </Link>
          </div>
        </CardFooter>
      </Card>
    </main>
  );
}
