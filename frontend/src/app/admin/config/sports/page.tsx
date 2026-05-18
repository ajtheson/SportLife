import { ConfigStatus } from "@prisma/client";
import Link from "next/link";

import { createSportAction, updateSportAction, updateSportStatusAction } from "@/features/config/config-actions";
import { listSports } from "@/features/config/config-service";

import { configMessage, requireAdminPage } from "../config-page-utils";

type SportsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function SportsPage({ searchParams }: SportsPageProps) {
  await requireAdminPage();
  const [sports, message] = await Promise.all([listSports(), configMessage(searchParams)]);

  return (
    <main className="min-h-screen bg-[#f7f4ed] px-6 py-10 text-[#1d2520]">
      <div className="mx-auto grid w-full max-w-5xl gap-6">
        <Header title="Sports" />
        {message ? <div className="rounded-md border border-[#d9d2c1] bg-white p-4 text-sm">{message}</div> : null}

        <form action={createSportAction} className="grid gap-3 rounded-lg border border-[#d9d2c1] bg-white p-5 sm:grid-cols-[1fr_auto]">
          <label className="grid gap-2 text-sm font-medium">
            New sport
            <input className="rounded-md border border-[#d9d2c1] px-3 py-2" name="name" required maxLength={60} />
          </label>
          <button className="self-end rounded-md bg-[#0f6b4f] px-4 py-2 font-medium text-white" type="submit">
            Add
          </button>
        </form>

        <div className="overflow-hidden rounded-lg border border-[#d9d2c1] bg-white">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="bg-[#fbfaf7]">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Usage</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {sports.map((sport) => {
                const nextStatus = sport.status === ConfigStatus.ACTIVE ? ConfigStatus.INACTIVE : ConfigStatus.ACTIVE;
                const usage = sport._count.playerSportLevels + sport._count.venueSports + sport._count.matches;

                return (
                  <tr key={sport.id} className="border-t border-[#ece5d8] align-top">
                    <td className="px-4 py-3">
                      <form action={updateSportAction} className="flex min-w-60 gap-2">
                        <input name="sportId" type="hidden" value={sport.id} />
                        <input
                          className="min-w-0 flex-1 rounded-md border border-[#d9d2c1] px-3 py-2"
                          name="name"
                          defaultValue={sport.name}
                          required
                          maxLength={60}
                        />
                        <button className="rounded-md border border-[#d9d2c1] px-3 py-2" type="submit">
                          Save
                        </button>
                      </form>
                    </td>
                    <td className="px-4 py-3">{sport.status}</td>
                    <td className="px-4 py-3">{usage} linked records</td>
                    <td className="px-4 py-3">
                      <form action={updateSportStatusAction}>
                        <input name="sportId" type="hidden" value={sport.id} />
                        <input name="status" type="hidden" value={nextStatus} />
                        <button className="rounded-md border border-[#d9d2c1] px-3 py-2" type="submit">
                          Set {nextStatus}
                        </button>
                      </form>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}

function Header({ title }: { title: string }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 className="text-3xl font-semibold">{title}</h1>
        <p className="mt-3 text-[#5f6b63]">Active values are available in Player profile and future flows.</p>
      </div>
      <div className="flex gap-2">
        <Link className="rounded-md border border-[#d9d2c1] bg-white px-3 py-2 text-sm font-medium" href="/admin/config">
          Config
        </Link>
      </div>
    </div>
  );
}
