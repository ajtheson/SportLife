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
  const [existingPhoneOwner, currentProfile] = await Promise.all([
    prisma.venueOwnerProfile.findUnique({
      where: { phone: input.phone },
      select: { userId: true },
    }),
    prisma.venueOwnerProfile.findUnique({
      where: { userId },
      select: { phone: true },
    }),
  ]);

  if (existingPhoneOwner && existingPhoneOwner.userId !== userId) {
    throw new Error("PHONE_ALREADY_EXISTS");
  }

  const phoneChanged = currentProfile?.phone !== input.phone;

  await prisma.$transaction(async (tx) => {
    await tx.venueOwnerProfile.upsert({
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

    if (phoneChanged) {
      await tx.user.update({
        where: { id: userId },
        data: { phoneVerifiedAt: null },
      });
    }
  });
}
