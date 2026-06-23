import { UserRole } from "@prisma/client";

import { addMinutes, generateOtpCode, hashToken } from "@/lib/auth/tokens";
import { prisma } from "@/lib/db/prisma";
import { sendSms } from "@/lib/sms/sms-service";

const otpExpiryMinutes = 5;
const resendCooldownSeconds = 60;
const maxSendsPerHour = 5;
const maxAttemptsPerCode = 5;

export type RequestOtpResult =
  | { ok: true }
  | { ok: false; reason: "no_profile" | "cooldown" | "quota_exceeded" };

export type VerifyOtpResult =
  | { ok: true }
  | { ok: false; reason: "no_code" | "expired" | "too_many_attempts" | "invalid_code" };

export function userNeedsPhoneVerification(user: {
  role: UserRole;
  phoneVerifiedAt: Date | null;
}) {
  return user.role !== UserRole.ADMIN && !user.phoneVerifiedAt;
}

async function getProfilePhone(userId: string, role: UserRole) {
  if (role === UserRole.PLAYER) {
    const profile = await prisma.playerProfile.findUnique({
      where: { userId },
      select: { phone: true },
    });
    return profile?.phone ?? null;
  }

  if (role === UserRole.VENUE_OWNER) {
    const profile = await prisma.venueOwnerProfile.findUnique({
      where: { userId },
      select: { phone: true },
    });
    return profile?.phone ?? null;
  }

  return null;
}

export function maskPhone(phone: string) {
  if (phone.length < 4) {
    return phone;
  }

  return `${phone.slice(0, 2)}****${phone.slice(-3)}`;
}

export async function getPhoneForUser(userId: string, role: UserRole) {
  return getProfilePhone(userId, role);
}

export async function requestPhoneOtp(userId: string, role: UserRole): Promise<RequestOtpResult> {
  const phone = await getProfilePhone(userId, role);

  if (!phone) {
    return { ok: false, reason: "no_profile" };
  }

  const now = new Date();
  const cooldownStart = new Date(now.getTime() - resendCooldownSeconds * 1_000);
  const hourStart = new Date(now.getTime() - 60 * 60 * 1_000);

  const [recentSend, sendsLastHour] = await Promise.all([
    prisma.phoneVerificationOtp.findFirst({
      where: { userId, createdAt: { gte: cooldownStart } },
      select: { id: true },
    }),
    prisma.phoneVerificationOtp.count({
      where: { userId, createdAt: { gte: hourStart } },
    }),
  ]);

  if (recentSend) {
    return { ok: false, reason: "cooldown" };
  }

  if (sendsLastHour >= maxSendsPerHour) {
    return { ok: false, reason: "quota_exceeded" };
  }

  const code = generateOtpCode();

  await prisma.$transaction([
    prisma.phoneVerificationOtp.updateMany({
      where: { userId, usedAt: null },
      data: { usedAt: now },
    }),
    prisma.phoneVerificationOtp.create({
      data: {
        userId,
        phone,
        codeHash: hashToken(code),
        expiresAt: addMinutes(now, otpExpiryMinutes),
      },
    }),
  ]);

  await sendSms({
    to: phone,
    text: `Ma xac thuc SportLife cua ban la ${code}. Ma het han sau ${otpExpiryMinutes} phut.`,
  });

  return { ok: true };
}

export async function verifyPhoneOtp(userId: string, code: string): Promise<VerifyOtpResult> {
  const record = await prisma.phoneVerificationOtp.findFirst({
    where: { userId, usedAt: null },
    orderBy: { createdAt: "desc" },
  });

  if (!record) {
    return { ok: false, reason: "no_code" };
  }

  const now = new Date();

  if (record.expiresAt < now) {
    return { ok: false, reason: "expired" };
  }

  if (record.attemptCount >= maxAttemptsPerCode) {
    await prisma.phoneVerificationOtp.update({
      where: { id: record.id },
      data: { usedAt: now },
    });
    return { ok: false, reason: "too_many_attempts" };
  }

  if (record.codeHash !== hashToken(code)) {
    const attemptCount = record.attemptCount + 1;
    await prisma.phoneVerificationOtp.update({
      where: { id: record.id },
      data: {
        attemptCount,
        ...(attemptCount >= maxAttemptsPerCode ? { usedAt: now } : {}),
      },
    });
    return { ok: false, reason: "invalid_code" };
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { phoneVerifiedAt: now },
    }),
    prisma.phoneVerificationOtp.update({
      where: { id: record.id },
      data: { usedAt: now },
    }),
  ]);

  return { ok: true };
}
