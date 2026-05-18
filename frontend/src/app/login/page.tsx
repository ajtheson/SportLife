import Link from "next/link";

import { loginAction } from "@/features/auth/auth-actions";
import { authMessage } from "@/features/auth/auth-messages";

type LoginPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const message = authMessage(await searchParams);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6 py-12">
      <h1 className="text-3xl font-semibold">Login</h1>
      <p className="mt-3 text-[#5f6b63]">Use your verified SportLife account.</p>

      {message ? (
        <div className="mt-6 rounded-md border border-[#d9d2c1] bg-white p-4 text-sm text-[#1d2520]">{message}</div>
      ) : null}

      <form action={loginAction} className="mt-6 grid gap-4">
        <label className="grid gap-2 text-sm font-medium">
          Email
          <input
            className="rounded-md border border-[#d9d2c1] bg-white px-3 py-2"
            name="email"
            type="email"
            autoComplete="email"
            required
          />
        </label>

        <label className="grid gap-2 text-sm font-medium">
          Password
          <input
            className="rounded-md border border-[#d9d2c1] bg-white px-3 py-2"
            name="password"
            type="password"
            autoComplete="current-password"
            required
          />
        </label>

        <button className="rounded-md bg-[#0f6b4f] px-4 py-2 font-medium text-white hover:bg-[#0b573f]" type="submit">
          Login
        </button>
      </form>

      <Link className="mt-4 text-sm font-medium text-[#0f6b4f]" href="/forgot-password">
        Forgot password?
      </Link>
    </main>
  );
}
