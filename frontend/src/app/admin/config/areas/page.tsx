import { ConfigStatus } from "@prisma/client";
import Link from "next/link";

import { createAreaAction, updateAreaAction, updateAreaStatusAction } from "@/features/config/config-actions";
import { listAreas } from "@/features/config/config-service";

import { configMessage, requireAdminPage } from "../config-page-utils";

type AreasPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AreasPage({ searchParams }: AreasPageProps) {
  await requireAdminPage();
  const [areas, message] = await Promise.all([listAreas(), configMessage(searchParams)]);

  return (
    <main className="min-h-screen bg-[#f7f4ed] px-6 py-10 text-[#1d2520]">
      <div className="mx-auto grid w-full max-w-6xl gap-6">
        <Header />
        {message ? <div className="rounded-md border border-[#d9d2c1] bg-white p-4 text-sm">{message}</div> : null}

        <form action={createAreaAction} className="grid gap-3 rounded-lg border border-[#d9d2c1] bg-white p-5 md:grid-cols-[1fr_180px_auto]">
          <label className="grid gap-2 text-sm font-medium">
            New Hanoi area
            <input className="rounded-md border border-[#d9d2c1] px-3 py-2" name="name" required maxLength={100} />
          </label>
          <label className="grid gap-2 text-sm font-medium">
            Type
            <select className="rounded-md border border-[#d9d2c1] px-3 py-2" name="type" required>
              <option value="ward">Ward</option>
              <option value="commune">Commune</option>
            </select>
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
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Usage</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {areas.map((area) => {
                const nextStatus = area.status === ConfigStatus.ACTIVE ? ConfigStatus.INACTIVE : ConfigStatus.ACTIVE;
                const usage =
                  area._count.playerProfiles + area._count.venues + area._count.matches + area._count.communityPosts;

                return (
                  <tr key={area.id} className="border-t border-[#ece5d8] align-top">
                    <td className="px-4 py-3" colSpan={2}>
                      <form action={updateAreaAction} className="grid min-w-96 gap-2 sm:grid-cols-[1fr_150px_auto]">
                        <input name="areaId" type="hidden" value={area.id} />
                        <input
                          aria-label={`${area.name} name`}
                          className="rounded-md border border-[#d9d2c1] px-3 py-2"
                          name="name"
                          defaultValue={area.name}
                          required
                          maxLength={100}
                        />
                        <select
                          aria-label={`${area.name} type`}
                          className="rounded-md border border-[#d9d2c1] px-3 py-2"
                          name="type"
                          defaultValue={area.type}
                          required
                        >
                          <option value="ward">Ward</option>
                          <option value="commune">Commune</option>
                        </select>
                        <button className="rounded-md border border-[#d9d2c1] px-3 py-2" type="submit">
                          Save
                        </button>
                      </form>
                    </td>
                    <td className="px-4 py-3">{area.status}</td>
                    <td className="px-4 py-3">{usage} linked records</td>
                    <td className="px-4 py-3">
                      <form action={updateAreaStatusAction}>
                        <input name="areaId" type="hidden" value={area.id} />
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

function Header() {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 className="text-3xl font-semibold">Hanoi areas</h1>
        <p className="mt-3 text-[#5f6b63]">Configure active wards and communes available to SportLife users.</p>
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
