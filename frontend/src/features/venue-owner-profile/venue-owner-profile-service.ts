import { prisma } from "@/lib/db/prisma";

import type { VenueOwnerProfileInput } from "./venue-owner-profile-schemas";

export async function getVenueOwnerProfile(userId: string) {
  return prisma.venueOwnerProfile.findUnique({
    where: { userId },
  });
}

export async function userHasVenueOwnerProfile(userId: string) {
  const profile = await prisma.venueOwnerProfile.findUnique({
    where: { userId },
    select: { id: true },
  });

  return Boolean(profile);
}

export async function saveVenueOwnerProfile(userId: string, input: VenueOwnerProfileInput) {
  const existingPhoneOwner = await prisma.venueOwnerProfile.findUnique({
    where: { phone: input.phone },
    select: { userId: true },
  });

  if (existingPhoneOwner && existingPhoneOwner.userId !== userId) {
    throw new Error("PHONE_ALREADY_EXISTS");
  }

  await prisma.venueOwnerProfile.upsert({
    where: { userId },
    update: {
      businessName: input.businessName,
      phone: input.phone,
    },
    create: {
      userId,
      businessName: input.businessName,
      phone: input.phone,
    },
  });
}
