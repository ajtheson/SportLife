import { ConfigStatus } from "@prisma/client";
import Link from "next/link";

import {
  createSkillLevelAction,
  updateSkillLevelAction,
  updateSkillLevelStatusAction,
} from "@/features/config/config-actions";
import { listSkillLevels } from "@/features/config/config-service";

import { configMessage, requireAdminPage } from "../config-page-utils";

type LevelsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function LevelsPage({ searchParams }: LevelsPageProps) {
  await requireAdminPage();
  const [sports, message] = await Promise.all([listSkillLevels(), configMessage(searchParams)]);
  const activeSports = sports.filter((sport) => sport.status === ConfigStatus.ACTIVE);

  return (
    <main className="min-h-screen bg-[#f7f4ed] px-6 py-10 text-[#1d2520]">
      <div className="mx-auto grid w-full max-w-5xl gap-6">
        <Header />
        {message ? <div className="rounded-md border border-[#d9d2c1] bg-white p-4 text-sm">{message}</div> : null}

        <form action={createSkillLevelAction} className="grid gap-3 rounded-lg border border-[#d9d2c1] bg-white p-5 md:grid-cols-[1fr_1fr_120px_auto]">
          <label className="grid gap-2 text-sm font-medium">
            Sport
            <select className="rounded-md border border-[#d9d2c1] px-3 py-2" name="sportId" required>
              {activeSports.map((sport) => (
                <option key={sport.id} value={sport.id}>
                  {sport.name}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-2 text-sm font-medium">
            New level
            <input className="rounded-md border border-[#d9d2c1] px-3 py-2" name="name" required maxLength={60} />
          </label>
          <label className="grid gap-2 text-sm font-medium">
            Order
            <input className="rounded-md border border-[#d9d2c1] px-3 py-2" name="order" type="number" min={1} max={100} required />
          </label>
          <button className="self-end rounded-md bg-[#0f6b4f] px-4 py-2 font-medium text-white" type="submit">
            Add
          </button>
        </form>

        <div className="grid gap-4">
          {sports.map((sport) => (
            <section key={sport.id} className="rounded-lg border border-[#d9d2c1] bg-white">
              <div className="flex items-center justify-between gap-4 border-b border-[#ece5d8] px-4 py-3">
                <h2 className="text-lg font-semibold">{sport.name}</h2>
                <span className="text-sm text-[#5f6b63]">{sport.status}</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-sm">
                  <thead className="bg-[#fbfaf7]">
                    <tr>
                      <th className="px-4 py-3">Order</th>
                      <th className="px-4 py-3">Name</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sport.skillLevels.map((level) => {
                      const nextStatus =
                        level.status === ConfigStatus.ACTIVE ? ConfigStatus.INACTIVE : ConfigStatus.ACTIVE;

                      return (
                        <tr key={level.id} className="border-t border-[#ece5d8] align-top">
                          <td className="px-4 py-3" colSpan={2}>
                            <form action={updateSkillLevelAction} className="grid min-w-80 gap-2 sm:grid-cols-[90px_1fr_auto]">
                              <input name="skillLevelId" type="hidden" value={level.id} />
                              <input
                                aria-label={`${level.name} order`}
                                className="rounded-md border border-[#d9d2c1] px-3 py-2"
                                name="order"
                                type="number"
                                min={1}
                                max={100}
                                defaultValue={level.order}
                                required
                              />
                              <input
                                aria-label={`${level.name} name`}
                                className="rounded-md border border-[#d9d2c1] px-3 py-2"
                                name="name"
                                defaultValue={level.name}
                                required
                                maxLength={60}
                              />
                              <button className="rounded-md border border-[#d9d2c1] px-3 py-2" type="submit">
                                Save
                              </button>
                            </form>
                          </td>
                          <td className="px-4 py-3">{level.status}</td>
                          <td className="px-4 py-3">
                            <form action={updateSkillLevelStatusAction}>
                              <input name="skillLevelId" type="hidden" value={level.id} />
                              <input name="status" type="hidden" value={nextStatus} />
                              <button className="rounded-md border border-[#d9d2c1] px-3 py-2" type="submit">
                                Set {nextStatus}
                              </button>
                            </form>
                          </td>
                        </tr>
                      );
                    })}
                    {sport.skillLevels.length === 0 ? (
                      <tr>
                        <td className="px-4 py-3 text-[#5f6b63]" colSpan={4}>
                          No skill levels yet.
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}

function Header() {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 className="text-3xl font-semibold">Skill levels</h1>
        <p className="mt-3 text-[#5f6b63]">Configure ordered levels per active sport.</p>
      </div>
      <div className="flex gap-2">
        <Link className="rounded-md border border-[#d9d2c1] bg-white px-3 py-2 text-sm font-medium" href="/admin/config">
          Config
        </Link>
        <Link className="rounded-md border border-[#d9d2c1] bg-white px-3 py-2 text-sm font-medium" href="/">
          Home
        </Link>
      </div>
    </div>
  );
}
