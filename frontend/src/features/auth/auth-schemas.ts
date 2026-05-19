import { UserRole } from "@prisma/client";
import { z } from "zod";

const publicRegistrationRoles = [UserRole.PLAYER, UserRole.VENUE_OWNER] as const;

export const registerSchema = z
  .object({
    email: z.string().trim().toLowerCase().email(),
    password: z.string().min(8, "Mật khẩu phải có ít nhất 8 ký tự."),
    confirmPassword: z.string().min(8),
    role: z.enum(publicRegistrationRoles),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: "Mật khẩu không khớp.",
    path: ["confirmPassword"],
  });

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
});

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1),
    password: z.string().min(8, "Mật khẩu phải có ít nhất 8 ký tự."),
    confirmPassword: z.string().min(8),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: "Mật khẩu không khớp.",
    path: ["confirmPassword"],
  });

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
