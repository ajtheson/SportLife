import { UserRole } from "@prisma/client";
import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { getVenueFormData } from "@/features/venues/venue-service";
import { buttonVariants } from "@/components/ui/button";

import { VenueForm } from "../venue-form";

type NewVenuePageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

async function formMessage(searchParams: Promise<Record<string, string | string[] | undefined>>) {
  const params = await searchParams;
  return params.error === "invalid_input" ? "Vui lòng kiểm tra lại thông tin sân và thử lại." : null;
}

export default async function NewVenuePage({ searchParams }: NewVenuePageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== UserRole.VENUE_OWNER) {
    redirect("/");
  }

  const [{ areas, sports, profile }, message] = await Promise.all([
    getVenueFormData(session.user.id),
    formMessage(searchParams),
  ]);

  if (!profile) {
    redirect("/venue-owner/profile");
  }

  return (
    <main className="min-h-screen bg-background px-6 py-10 text-foreground">
      <div className="mx-auto grid w-full max-w-3xl gap-6">
        <Header title="Thêm sân mới" />
        {message ? <div className="rounded-md border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">{message}</div> : null}
        <VenueForm areas={areas} sports={sports} venue={null} defaultPhone={profile.phone} />
      </div>
    </main>
  );
}

function Header({ title }: { title: string }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-primary">{title}</h1>
        <p className="mt-2 text-muted-foreground">Sân mới cần được admin duyệt trước khi hiển thị.</p>
      </div>
      <Link className={buttonVariants({ variant: "outline" })} href="/venue-owner">
        ← Sân của tôi
      </Link>
    </div>
  );
}
