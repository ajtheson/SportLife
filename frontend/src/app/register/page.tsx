import Link from "next/link";
import { registerAction } from "@/features/auth/auth-actions";
import { authMessage } from "@/features/auth/auth-messages";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

type RegisterPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const message = authMessage(await searchParams);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6 py-12">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Tạo tài khoản</CardTitle>
          <CardDescription>Đăng ký tham gia hệ thống với tư cách Người chơi hoặc Chủ sân.</CardDescription>
        </CardHeader>
        <CardContent>
          {message ? (
            <div className="mb-6 rounded-md border border-border bg-muted p-4 text-sm text-foreground">{message}</div>
          ) : null}

          <form action={registerAction} className="grid gap-4">
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
                autoComplete="new-password"
                minLength={8}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="confirmPassword">Xác nhận mật khẩu</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                minLength={8}
                required
              />
            </div>

            <fieldset className="grid gap-3 rounded-lg border border-border p-4">
              <legend className="-ml-1 bg-card px-1 text-sm font-medium">Vai trò</legend>
              <Label className="flex items-center gap-2 font-normal">
                <input className="size-4 accent-primary" name="role" type="radio" value="PLAYER" defaultChecked />
                Người chơi
              </Label>
              <Label className="flex items-center gap-2 font-normal">
                <input className="size-4 accent-primary" name="role" type="radio" value="VENUE_OWNER" />
                Chủ sân
              </Label>
            </fieldset>

            <Button type="submit" className="w-full">
              Đăng ký
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <div className="text-center text-sm text-muted-foreground">
            Đã có tài khoản?{" "}
            <Link className="font-medium text-primary hover:underline" href="/login">
              Đăng nhập
            </Link>
          </div>
        </CardFooter>
      </Card>
    </main>
  );
}
