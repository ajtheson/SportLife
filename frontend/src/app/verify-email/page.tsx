import Link from "next/link";

import { verifyEmailToken } from "@/features/auth/auth-service";

type VerifyEmailPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function VerifyEmailPage({ searchParams }: VerifyEmailPageProps) {
  const token = (await searchParams).token;
  const result = typeof token === "string" ? await verifyEmailToken(token) : { ok: false };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6 py-12">
      <h1 className="text-3xl font-semibold">{result.ok ? "Email verified" : "Verification failed"}</h1>
      <p className="mt-3 text-[#5f6b63]">
        {result.ok
          ? "Your account is active. You can now log in."
          : "This verification link is invalid, expired, or already used."}
      </p>
      <Link className="mt-6 rounded-md bg-[#0f6b4f] px-4 py-2 text-center font-medium text-white" href="/login">
        Go to login
      </Link>
    </main>
  );
}
