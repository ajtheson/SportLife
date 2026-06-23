import { UserRole } from "@prisma/client";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import {
  requestPhoneOtpAction,
  verifyPhoneOtpAction,
} from "@/features/auth/phone-verification-actions";
import {
  getPhoneForUser,
  maskPhone,
  userNeedsPhoneVerification,
} from "@/features/auth/phone-verification-service";
import { prisma } from "@/lib/db/prisma";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type VerifyPhonePageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function verifyPhoneMessage(params: Record<string, string | string[] | undefined>) {
  const error = typeof params.error === "string" ? params.error : undefined;
  const status = typeof params.status === "string" ? params.status : undefined;

  if (status === "otp_sent") {
    return { tone: "info" as const, text: "Đã gửi mã xác thực tới số điện thoại của bạn." };
  }

  if (error === "cooldown") {
    return { tone: "error" as const, text: "Vui lòng chờ 60 giây trước khi gửi lại mã." };
  }

  if (error === "quota_exceeded") {
    return { tone: "error" as const, text: "Bạn đã gửi quá nhiều mã. Vui lòng thử lại sau một giờ." };
  }

  if (error === "expired") {
    return { tone: "error" as const, text: "Mã đã hết hạn. Vui lòng gửi lại mã mới." };
  }

  if (error === "too_many_attempts") {
    return { tone: "error" as const, text: "Nhập sai quá nhiều lần. Vui lòng gửi lại mã mới." };
  }

  if (error === "invalid_code") {
    return { tone: "error" as const, text: "Mã xác thực không đúng. Vui lòng thử lại." };
  }

  if (error === "no_code") {
    return { tone: "error" as const, text: "Chưa có mã nào được gửi. Vui lòng bấm gửi mã." };
  }

  if (error === "no_profile") {
    return { tone: "error" as const, text: "Vui lòng hoàn thiện hồ sơ với số điện thoại trước." };
  }

  return null;
}

export default async function VerifyPhonePage({ searchParams }: VerifyPhonePageProps) {
  const session = await auth();

  if (!session?.user?.id || !session.user.role) {
    redirect("/login");
  }

  if (session.user.role === UserRole.ADMIN) {
    redirect("/");
  }

  const record = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, phoneVerifiedAt: true },
  });

  if (!record || !userNeedsPhoneVerification(record)) {
    redirect("/");
  }

  const phone = await getPhoneForUser(session.user.id, session.user.role);

  if (!phone) {
    redirect(session.user.role === UserRole.PLAYER ? "/player/profile" : "/venue-owner/profile");
  }

  const params = await searchParams;
  const message = verifyPhoneMessage(params);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6 py-12">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Xác thực số điện thoại</CardTitle>
          <CardDescription>
            Để bảo vệ hệ thống, bạn cần xác thực số điện thoại {maskPhone(phone)} trước khi tiếp tục.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {message ? (
            <div
              className={
                message.tone === "error"
                  ? "mb-6 rounded-md border border-destructive/20 bg-destructive/5 p-4 text-sm text-foreground"
                  : "mb-6 rounded-md border border-border bg-muted p-4 text-sm text-foreground"
              }
            >
              {message.text}
            </div>
          ) : null}

          <form action={verifyPhoneOtpAction} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="code">Mã xác thực (6 chữ số)</Label>
              <Input
                id="code"
                name="code"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="\d{6}"
                maxLength={6}
                required
              />
            </div>

            <Button type="submit" className="w-full">
              Xác nhận
            </Button>
          </form>

          <form action={requestPhoneOtpAction} className="mt-4">
            <Button type="submit" variant="outline" className="w-full">
              Gửi mã xác thực
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
