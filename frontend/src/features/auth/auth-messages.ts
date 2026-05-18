export function authMessage(searchParams: Record<string, string | string[] | undefined>) {
  const error = typeof searchParams.error === "string" ? searchParams.error : undefined;
  const status = typeof searchParams.status === "string" ? searchParams.status : undefined;

  if (status === "verification_sent") {
    return "Registration successful. Check your email to verify your account.";
  }

  if (status === "reset_sent") {
    return "If the email exists, a reset link has been sent.";
  }

  if (status === "password_reset") {
    return "Password reset successful. You can now log in.";
  }

  if (error === "email_exists") {
    return "An account with this email already exists.";
  }

  if (error === "invalid_credentials") {
    return "Invalid email, password, or unverified account.";
  }

  if (error === "invalid_token") {
    return "The link is invalid or expired.";
  }

  if (error) {
    return "Please check the form and try again.";
  }

  return undefined;
}
