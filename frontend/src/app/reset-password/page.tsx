import { resetPasswordAction } from "@/features/auth/auth-actions";
import { authMessage } from "@/features/auth/auth-messages";

type ResetPasswordPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const params = await searchParams;
  const token = typeof params.token === "string" ? params.token : "";
  const message = authMessage(params);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6 py-12">
      <h1 className="text-3xl font-semibold">Set new password</h1>
      <p className="mt-3 text-[#5f6b63]">Choose a new password for your SportLife account.</p>

      {message ? (
        <div className="mt-6 rounded-md border border-[#d9d2c1] bg-white p-4 text-sm text-[#1d2520]">{message}</div>
      ) : null}

      <form action={resetPasswordAction} className="mt-6 grid gap-4">
        <input name="token" type="hidden" value={token} />

        <label className="grid gap-2 text-sm font-medium">
          New password
          <input
            className="rounded-md border border-[#d9d2c1] bg-white px-3 py-2"
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
          />
        </label>

        <label className="grid gap-2 text-sm font-medium">
          Confirm password
          <input
            className="rounded-md border border-[#d9d2c1] bg-white px-3 py-2"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
          />
        </label>

        <button className="rounded-md bg-[#0f6b4f] px-4 py-2 font-medium text-white hover:bg-[#0b573f]" type="submit">
          Update password
        </button>
      </form>
    </main>
  );
}
