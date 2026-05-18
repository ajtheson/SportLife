import { UserRole } from "@prisma/client";

import { hashPassword } from "@/lib/auth/password";
import { addHours, addMinutes, generatePlainToken, hashToken } from "@/lib/auth/tokens";
import { prisma } from "@/lib/db/prisma";
import { sendEmail } from "@/lib/email/email-service";

import type { ForgotPasswordInput, RegisterInput, ResetPasswordInput } from "./auth-schemas";

const verificationTokenHours = 24;
const resetTokenMinutes = 30;

function appUrl(path: string) {
  const baseUrl = process.env.APP_BASE_URL ?? "http://localhost:3000";
  return new URL(path, baseUrl).toString();
}

function formatRoleName(role: UserRole) {
  return role === UserRole.PLAYER ? "Player" : "Venue Owner";
}

async function sendVerificationEmail(email: string, token: string) {
  const url = appUrl(`/verify-email?token=${encodeURIComponent(token)}`);

  await sendEmail({
    to: email,
    subject: "Verify your SportLife account",
    text: `Welcome to SportLife. Verify your email by opening this link: ${url}`,
    html: `<p>Welcome to SportLife.</p><p><a href="${url}">Verify your email</a></p>`,
  });
}

async function sendPasswordResetEmail(email: string, token: string) {
  const url = appUrl(`/reset-password?token=${encodeURIComponent(token)}`);

  await sendEmail({
    to: email,
    subject: "Reset your SportLife password",
    text: `Reset your SportLife password by opening this link: ${url}`,
    html: `<p>Reset your SportLife password.</p><p><a href="${url}">Set a new password</a></p>`,
  });
}

export async function registerUser(input: RegisterInput) {
  const plainToken = generatePlainToken();
  const passwordHash = await hashPassword(input.password);
  const existingUser = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (existingUser?.emailVerified || (existingUser && existingUser.status !== "ACTIVE")) {
    throw new Error("EMAIL_ALREADY_EXISTS");
  }

  if (existingUser) {
    await prisma.$transaction([
      prisma.user.update({
        where: { id: existingUser.id },
        data: {
          passwordHash,
          role: input.role,
          name: formatRoleName(input.role),
        },
      }),
      prisma.verificationToken.updateMany({
        where: {
          userId: existingUser.id,
          usedAt: null,
        },
        data: { usedAt: new Date() },
      }),
      prisma.verificationToken.create({
        data: {
          userId: existingUser.id,
          tokenHash: hashToken(plainToken),
          expiresAt: addHours(new Date(), verificationTokenHours),
        },
      }),
    ]);

    await sendVerificationEmail(existingUser.email, plainToken);
    return;
  }

  const user = await prisma.user.create({
    data: {
      email: input.email,
      passwordHash,
      role: input.role,
      name: formatRoleName(input.role),
      verificationTokens: {
        create: {
          tokenHash: hashToken(plainToken),
          expiresAt: addHours(new Date(), verificationTokenHours),
        },
      },
    },
  });

  await sendVerificationEmail(user.email, plainToken);
}

export async function verifyEmailToken(token: string) {
  const tokenHash = hashToken(token);

  const record = await prisma.verificationToken.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  if (!record || record.usedAt || record.expiresAt < new Date() || record.user.status !== "ACTIVE") {
    return { ok: false, reason: "invalid" as const };
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: record.userId },
      data: { emailVerified: new Date() },
    }),
    prisma.verificationToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    }),
  ]);

  return { ok: true, reason: "verified" as const };
}

export async function requestPasswordReset(input: ForgotPasswordInput) {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (!user || user.status !== "ACTIVE") {
    return;
  }

  const plainToken = generatePlainToken();

  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(plainToken),
      expiresAt: addMinutes(new Date(), resetTokenMinutes),
    },
  });

  await sendPasswordResetEmail(user.email, plainToken);
}

export async function resetPassword(input: ResetPasswordInput) {
  const record = await prisma.passwordResetToken.findUnique({
    where: { tokenHash: hashToken(input.token) },
    include: { user: true },
  });

  if (!record || record.usedAt || record.expiresAt < new Date() || record.user.status !== "ACTIVE") {
    throw new Error("INVALID_RESET_TOKEN");
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: record.userId },
      data: { passwordHash: await hashPassword(input.password) },
    }),
    prisma.passwordResetToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    }),
  ]);
}
