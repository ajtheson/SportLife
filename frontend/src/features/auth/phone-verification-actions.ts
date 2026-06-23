"use server";

import { redirect } from "next/navigation";

import { auth } from "@/auth";

import { UserRole } from "@prisma/client";

import { phoneOtpSchema } from "./auth-schemas";
import { requestPhoneOtp, verifyPhoneOtp } from "./phone-verification-service";

function redirectWith(key: "error" | "status", value: string): never {
  redirect(`/verify-phone?${key}=${encodeURIComponent(value)}`);
}

export async function requestPhoneOtpAction() {
  const session = await auth();

  if (!session?.user?.id || !session.user.role) {
    redirect("/login");
  }

  const result = await requestPhoneOtp(session.user.id, session.user.role);

  if (!result.ok) {
    redirectWith("error", result.reason);
  }

  redirectWith("status", "otp_sent");
}

export async function verifyPhoneOtpAction(formData: FormData) {
  const session = await auth();

  if (!session?.user?.id || !session.user.role) {
    redirect("/login");
  }

  const parsed = phoneOtpSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    redirectWith("error", "invalid_code");
  }

  const result = await verifyPhoneOtp(session.user.id, parsed.data.code);

  if (!result.ok) {
    redirectWith("error", result.reason);
  }

  const target = session.user.role === UserRole.VENUE_OWNER ? "/venue-owner/profile" : "/player/profile";
  redirect(`${target}?status=phone_verified`);
}

