import { registerAction } from "@/features/auth/auth-actions";
import { authMessage } from "@/features/auth/auth-messages";

type RegisterPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const message = authMessage(await searchParams);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6 py-12">
      <h1 className="text-3xl font-semibold">Create account</h1>
      <p className="mt-3 text-[#5f6b63]">Register as a Player or Venue Owner.</p>

      {message ? (
        <div className="mt-6 rounded-md border border-[#d9d2c1] bg-white p-4 text-sm text-[#1d2520]">{message}</div>
      ) : null}

      <form action={registerAction} className="mt-6 grid gap-4">
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

        <fieldset className="grid gap-3">
          <legend className="text-sm font-medium">Role</legend>
          <label className="flex items-center gap-2 text-sm">
            <input name="role" type="radio" value="PLAYER" defaultChecked />
            Player
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input name="role" type="radio" value="VENUE_OWNER" />
            Venue Owner
          </label>
        </fieldset>

        <button className="rounded-md bg-[#0f6b4f] px-4 py-2 font-medium text-white hover:bg-[#0b573f]" type="submit">
          Register
        </button>
      </form>
    </main>
  );
}
