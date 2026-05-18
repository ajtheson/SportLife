import type { UserRole } from "@prisma/client";

export function hasRole(role: UserRole | undefined, allowedRoles: UserRole[]) {
  return Boolean(role && allowedRoles.includes(role));
}

export function assertRole(role: UserRole | undefined, allowedRoles: UserRole[]) {
  if (!hasRole(role, allowedRoles)) {
    throw new Error("Unauthorized");
  }
}
