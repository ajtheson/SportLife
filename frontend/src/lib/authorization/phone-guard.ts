import { UserRole } from "@prisma/client";

import { userNeedsPhoneVerification } from "@/features/auth/phone-verification-service";
import { prisma } from "@/lib/db/prisma";

export async function getPhoneGateRedirect(user: {
  id: string;
  role?: UserRole;
}): Promise<string | null> {
  if (!user.role || user.role === UserRole.ADMIN) {
    return null;
  }

  const record = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true, phoneVerifiedAt: true },
  });

  if (!record) {
    return null;
  }

  return userNeedsPhoneVerification(record) ? "/verify-phone" : null;
}
