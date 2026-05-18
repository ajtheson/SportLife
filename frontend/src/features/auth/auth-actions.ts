"use server";

import { AuthError } from "next-auth";
import { redirect } from "next/navigation";

import { signIn, signOut } from "@/auth";

import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
} from "./auth-schemas";
import { registerUser, requestPasswordReset, resetPassword } from "./auth-service";

function redirectWith(path: string, key: "error" | "status", value: string): never {
  redirect(`${path}?${key}=${encodeURIComponent(value)}`);
}

export async function registerAction(formData: FormData) {
  const parsed = registerSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    redirectWith("/register", "error", "invalid_input");
  }

  try {
    await registerUser(parsed.data);
  } catch (error) {
    if (error instanceof Error && error.message === "EMAIL_ALREADY_EXISTS") {
      redirectWith("/register", "error", "email_exists");
    }

    throw error;
  }

  redirectWith("/register", "status", "verification_sent");
}

export async function loginAction(formData: FormData) {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    redirectWith("/login", "error", "invalid_credentials");
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: "/",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      redirectWith("/login", "error", "invalid_credentials");
    }

    throw error;
  }
}

export async function logoutAction() {
  await signOut({ redirectTo: "/" });
}

export async function forgotPasswordAction(formData: FormData) {
  const parsed = forgotPasswordSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    redirectWith("/forgot-password", "error", "invalid_email");
  }

  await requestPasswordReset(parsed.data);
  redirectWith("/forgot-password", "status", "reset_sent");
}

export async function resetPasswordAction(formData: FormData) {
  const parsed = resetPasswordSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    redirectWith("/reset-password", "error", "invalid_input");
  }

  try {
    await resetPassword(parsed.data);
  } catch (error) {
    if (error instanceof Error && error.message === "INVALID_RESET_TOKEN") {
      redirectWith("/reset-password", "error", "invalid_token");
    }

    throw error;
  }

  redirectWith("/login", "status", "password_reset");
}
