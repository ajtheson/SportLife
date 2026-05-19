import { resetPasswordAction } from "@/features/auth/auth-actions";
import { authMessage } from "@/features/auth/auth-messages";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type ResetPasswordPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const params = await searchParams;
  const token = typeof params.token === "string" ? params.token : "";
  const message = authMessage(params);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6 py-12">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Đặt lại mật khẩu</CardTitle>
          <CardDescription>Chọn mật khẩu mới cho tài khoản SportLife của bạn.</CardDescription>
        </CardHeader>
        <CardContent>
          {message ? (
            <div className="mb-6 rounded-md border border-border bg-muted p-4 text-sm text-foreground">{message}</div>
          ) : null}

          <form action={resetPasswordAction} className="grid gap-4">
            <input name="token" type="hidden" value={token} />

            <div className="grid gap-2">
              <Label htmlFor="password">Mật khẩu mới</Label>
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
              <Label htmlFor="confirmPassword">Xác nhận mật khẩu mới</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                minLength={8}
                required
              />
            </div>

            <Button type="submit" className="w-full">
              Cập nhật mật khẩu
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
