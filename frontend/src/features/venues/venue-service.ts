import { ApprovalStatus, ConfigStatus, Prisma, VisibilityStatus } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";

import type { VenueFormInput } from "./venue-schemas";

export async function getVenueFormData(ownerId: string, venueId?: string) {
  const [areas, sports, venue, profile] = await Promise.all([
    prisma.area.findMany({
      where: { city: "Hanoi", status: ConfigStatus.ACTIVE },
      orderBy: [{ type: "desc" }, { name: "asc" }],
    }),
    prisma.sport.findMany({
      where: { status: ConfigStatus.ACTIVE },
      orderBy: { name: "asc" },
    }),
    venueId
      ? prisma.venue.findFirst({
          where: { id: venueId, ownerId },
          include: { sports: true, images: { orderBy: { sortOrder: "asc" } } },
        })
      : null,
    prisma.venueOwnerProfile.findUnique({
      where: { userId: ownerId },
      select: { id: true, phone: true },
    }),
  ]);

  return { areas, sports, venue, profile };
}

export async function listOwnerVenues(ownerId: string) {
  return prisma.venue.findMany({
    where: { ownerId },
    include: {
      area: true,
      sports: { include: { sport: true } },
      images: { orderBy: { sortOrder: "asc" }, take: 1 },
    },
    orderBy: { updatedAt: "desc" },
  });
}

export async function saveOwnerVenue(ownerId: string, input: VenueFormInput) {
  const [profile, area, sports, existingVenue] = await Promise.all([
    prisma.venueOwnerProfile.findUnique({ where: { userId: ownerId }, select: { id: true } }),
    prisma.area.findFirst({
      where: { id: input.areaId, city: "Hanoi", status: ConfigStatus.ACTIVE },
      select: { id: true },
    }),
    prisma.sport.findFirst({
      where: { id: input.sportId, status: ConfigStatus.ACTIVE },
      select: { id: true },
    }),
    input.venueId
      ? prisma.venue.findFirst({
          where: { id: input.venueId, ownerId },
          select: { id: true },
        })
      : null,
  ]);

  if (!profile) {
    throw new Error("PROFILE_REQUIRED");
  }

  if (!area) {
    throw new Error("INVALID_AREA");
  }

  if (!sports) {
    throw new Error("INVALID_SPORT");
  }

  if (input.venueId && !existingVenue) {
    throw new Error("VENUE_NOT_FOUND");
  }

  const venueData = {
    name: input.name,
    address: input.address,
    areaId: input.areaId,
    phone: input.phone,
    description: input.description || null,
    availabilityNote: input.availabilityNote || null,
    openingHours: input.openingHours ? { text: input.openingHours } : Prisma.JsonNull,
    referencePrice: input.referencePrice || null,
    approvalStatus: ApprovalStatus.PENDING_APPROVAL,
    rejectionReason: null,
  };

  await prisma.$transaction(async (tx) => {
    const venue = input.venueId
      ? await tx.venue.update({
          where: { id: input.venueId },
          data: venueData,
          select: { id: true },
        })
      : await tx.venue.create({
          data: {
            ownerId,
            visibilityStatus: VisibilityStatus.ACTIVE,
            ...venueData,
          },
          select: { id: true },
        });

    await tx.venueSport.deleteMany({ where: { venueId: venue.id } });
    await tx.venueSport.create({
      data: {
        venueId: venue.id,
        sportId: input.sportId,
      },
    });

    await tx.venueImage.deleteMany({ where: { venueId: venue.id } });
    const imageUrls = input.imageUrls ?? [];

    if (imageUrls.length > 0) {
      await tx.venueImage.createMany({
        data: imageUrls.map((url, index) => ({
          venueId: venue.id,
          url,
          sortOrder: index + 1,
        })),
      });
    }
  });
}

export async function listAdminVenues() {
  return prisma.venue.findMany({
    include: {
      owner: { select: { email: true, venueOwnerProfile: true } },
      area: true,
      sports: { include: { sport: true } },
    },
    orderBy: [{ approvalStatus: "desc" }, { updatedAt: "desc" }],
  });
}

export async function approveVenue(venueId: string) {
  await prisma.venue.update({
    where: { id: venueId },
    data: {
      approvalStatus: ApprovalStatus.APPROVED,
      rejectionReason: null,
      visibilityStatus: VisibilityStatus.ACTIVE,
    },
  });
}

export async function rejectVenue(venueId: string, rejectionReason: string) {
  await prisma.venue.update({
    where: { id: venueId },
    data: {
      approvalStatus: ApprovalStatus.REJECTED,
      rejectionReason,
    },
  });
}

export async function setVenueVisibility(venueId: string, visibilityStatus: VisibilityStatus) {
  await prisma.venue.update({
    where: { id: venueId },
    data: { visibilityStatus },
  });
}

export async function listPublicVenues(filters: { sportId?: string; areaId?: string; q?: string }) {
  return prisma.venue.findMany({
    where: {
      approvalStatus: ApprovalStatus.APPROVED,
      visibilityStatus: VisibilityStatus.ACTIVE,
      areaId: filters.areaId || undefined,
      sports: filters.sportId ? { some: { sportId: filters.sportId } } : undefined,
      OR: filters.q
        ? [
            { name: { contains: filters.q, mode: "insensitive" } },
            { address: { contains: filters.q, mode: "insensitive" } },
          ]
        : undefined,
    },
    include: {
      area: true,
      sports: { include: { sport: true } },
      images: { orderBy: { sortOrder: "asc" }, take: 1 },
    },
    orderBy: { updatedAt: "desc" },
  });
}

export async function getPublicVenue(venueId: string) {
  const venue = await prisma.venue.findUnique({
    where: { id: venueId },
    include: {
      area: true,
      sports: { include: { sport: true } },
      images: { orderBy: { sortOrder: "asc" } },
      owner: { select: { venueOwnerProfile: true } },
    },
  });

  if (venue?.approvalStatus !== ApprovalStatus.APPROVED || venue.visibilityStatus !== VisibilityStatus.ACTIVE) {
    return null;
  }

  return venue;
}
