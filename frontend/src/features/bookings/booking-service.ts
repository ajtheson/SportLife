import {
  ApprovalStatus,
  BookingStatus,
  NotificationType,
  TimeSlotStatus,
  UserRole,
  UserStatus,
  VenueResourceStatus,
  VisibilityStatus,
} from "@prisma/client";
import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import { hanoiDateEndUtc, hanoiDateStartUtc } from "@/features/venue-schedule/venue-schedule-service";

import { activeBookingStatuses } from "./booking-schemas";
import type {
  CreateBookingInput,
  OwnerBookingDecisionInput,
  OwnerBookingFilterInput,
  PlayerCancelBookingInput,
} from "./booking-schemas";
import {
  SLOT_STATUS_ON_REQUEST,
  ownerCanDecide,
  ownerDecisionTransition,
  playerCanCancel,
  playerCancelTransition,
} from "./booking-transitions";

async function assertPlayerReady(playerId: string) {
  const user = await prisma.user.findUnique({
    where: { id: playerId },
    select: {
      role: true,
      status: true,
      emailVerified: true,
      playerProfile: { select: { id: true } },
    },
  });

  if (!user || user.status !== UserStatus.ACTIVE || !user.emailVerified || user.role !== UserRole.PLAYER) {
    throw new Error("BOOKING_NOT_ALLOWED");
  }

  if (!user.playerProfile) {
    throw new Error("PLAYER_PROFILE_REQUIRED");
  }
}

/**
 * Slot có thể đặt được + slot bận trong một ngày của venue (chỉ resource ACTIVE).
 * Dùng cho trang đặt sân của Player và tóm tắt lịch trống công khai.
 */
export async function getPublicVenueAvailability(venueId: string, dateText: string) {
  const venue = await prisma.venue.findFirst({
    where: {
      id: venueId,
      approvalStatus: ApprovalStatus.APPROVED,
      visibilityStatus: VisibilityStatus.ACTIVE,
    },
    select: { id: true, name: true, address: true, ownerId: true, phone: true },
  });

  if (!venue) {
    return null;
  }

  const [resources, slots] = await Promise.all([
    prisma.venueResource.findMany({
      where: { venueId, status: VenueResourceStatus.ACTIVE },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      select: { id: true, name: true, description: true },
    }),
    prisma.venueTimeSlot.findMany({
      where: {
        venueId,
        startAt: { gte: hanoiDateStartUtc(dateText), lt: hanoiDateEndUtc(dateText) },
        resource: { status: VenueResourceStatus.ACTIVE },
      },
      orderBy: [{ startAt: "asc" }],
      select: { id: true, resourceId: true, startAt: true, endAt: true, status: true },
    }),
  ]);

  return { venue, resources, slots, selectedDate: dateText };
}

export async function createBooking(playerId: string, input: CreateBookingInput) {
  await assertPlayerReady(playerId);

  const venue = await prisma.venue.findFirst({
    where: {
      id: input.venueId,
      approvalStatus: ApprovalStatus.APPROVED,
      visibilityStatus: VisibilityStatus.ACTIVE,
    },
    select: { id: true, ownerId: true },
  });

  if (!venue) {
    throw new Error("VENUE_NOT_FOUND");
  }

  const slot = await prisma.venueTimeSlot.findFirst({
    where: {
      id: input.slotId,
      venueId: input.venueId,
      resource: { status: VenueResourceStatus.ACTIVE },
    },
    select: { id: true, resourceId: true, startAt: true, endAt: true, status: true },
  });

  if (!slot) {
    throw new Error("SLOT_NOT_FOUND");
  }

  if (slot.startAt.getTime() <= Date.now()) {
    throw new Error("SLOT_IN_PAST");
  }

  return prisma.$transaction(async (tx) => {
    // Atomic claim: chỉ chiếm được slot khi vẫn còn AVAILABLE -> chống double-book.
    const claimed = await tx.venueTimeSlot.updateMany({
      where: {
        id: slot.id,
        status: TimeSlotStatus.AVAILABLE,
        resource: { status: VenueResourceStatus.ACTIVE },
      },
      data: { status: SLOT_STATUS_ON_REQUEST },
    });

    if (claimed.count === 0) {
      throw new Error("SLOT_NOT_AVAILABLE");
    }

    const booking = await tx.booking.create({
      data: {
        venueId: input.venueId,
        resourceId: slot.resourceId,
        slotId: slot.id,
        playerId,
        status: BookingStatus.PENDING,
        playerNote: input.playerNote || null,
        startAt: slot.startAt,
        endAt: slot.endAt,
      },
    });

    await tx.bookingStatusHistory.create({
      data: {
        bookingId: booking.id,
        fromStatus: null,
        toStatus: BookingStatus.PENDING,
        actorId: playerId,
        actorRole: UserRole.PLAYER,
      },
    });

    await tx.notification.create({
      data: {
        recipientId: venue.ownerId,
        type: NotificationType.BOOKING_REQUESTED,
        referenceId: booking.id,
      },
    });

    return booking;
  });
}

async function assertOwnerBooking(ownerId: string, bookingId: string) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: { id: true, slotId: true, playerId: true, status: true, venue: { select: { ownerId: true } } },
  });

  if (!booking || booking.venue.ownerId !== ownerId) {
    throw new Error("BOOKING_NOT_FOUND");
  }

  return booking;
}

export async function decideOwnerBooking(ownerId: string, input: OwnerBookingDecisionInput) {
  const booking = await assertOwnerBooking(ownerId, input.bookingId);

  if (!ownerCanDecide(booking.status, input.action)) {
    throw new Error("BOOKING_NOT_DECIDABLE");
  }

  if (input.action === "reject" && !input.reason) {
    throw new Error("REASON_REQUIRED");
  }

  const { bookingStatus, slotStatus } = ownerDecisionTransition(input.action);
  const notificationType =
    input.action === "confirm"
      ? NotificationType.BOOKING_CONFIRMED
      : input.action === "reject"
        ? NotificationType.BOOKING_REJECTED
        : NotificationType.BOOKING_CANCELED;

  await prisma.$transaction(async (tx) => {
    // Guard against concurrent transitions (e.g. Player cancels while Owner confirms).
    // Only update when the booking is still in the expected status; roll back if stale.
    const updated = await tx.booking.updateMany({
      where: { id: booking.id, status: booking.status },
      data: { status: bookingStatus, decisionReason: input.reason || null },
    });

    if (updated.count === 0) {
      throw new Error("BOOKING_CONCURRENT_TRANSITION");
    }

    await tx.bookingStatusHistory.create({
      data: {
        bookingId: booking.id,
        fromStatus: booking.status,
        toStatus: bookingStatus,
        actorId: ownerId,
        actorRole: UserRole.VENUE_OWNER,
        reason: input.reason || null,
      },
    });

    await tx.venueTimeSlot.update({
      where: { id: booking.slotId },
      data: { status: slotStatus, blockReason: null },
    });

    await tx.notification.create({
      data: {
        recipientId: booking.playerId,
        type: notificationType,
        referenceId: booking.id,
      },
    });
  });
}

export async function cancelBookingByPlayer(playerId: string, input: PlayerCancelBookingInput) {
  const booking = await prisma.booking.findUnique({
    where: { id: input.bookingId },
    select: { id: true, slotId: true, playerId: true, status: true, venue: { select: { ownerId: true } } },
  });

  if (!booking || booking.playerId !== playerId) {
    throw new Error("BOOKING_NOT_FOUND");
  }

  if (!playerCanCancel(booking.status)) {
    throw new Error("BOOKING_NOT_CANCELABLE");
  }

  const { bookingStatus, slotStatus } = playerCancelTransition();

  await prisma.$transaction(async (tx) => {
    // Guard against concurrent owner decision (e.g. Owner confirms while Player cancels).
    // Include playerId + status in WHERE to fail fast if the row was already transitioned.
    const updated = await tx.booking.updateMany({
      where: { id: booking.id, playerId: booking.playerId, status: booking.status },
      data: { status: bookingStatus },
    });

    if (updated.count === 0) {
      throw new Error("BOOKING_NOT_CANCELABLE");
    }

    await tx.bookingStatusHistory.create({
      data: {
        bookingId: booking.id,
        fromStatus: booking.status,
        toStatus: bookingStatus,
        actorId: playerId,
        actorRole: UserRole.PLAYER,
      },
    });

    await tx.venueTimeSlot.update({
      where: { id: booking.slotId },
      data: { status: slotStatus, blockReason: null },
    });

    await tx.notification.create({
      data: {
        recipientId: booking.venue.ownerId,
        type: NotificationType.BOOKING_CANCELED,
        referenceId: booking.id,
      },
    });
  });
}

export async function listOwnerBookings(
  ownerId: string,
  filters: OwnerBookingFilterInput & { q?: string; skip?: number; take?: number }
) {
  const where: Prisma.BookingWhereInput = {
    venue: { ownerId },
    venueId: filters.venueId || undefined,
    status: filters.status || undefined,
    player: filters.q
      ? {
          playerProfile: {
            displayName: { contains: filters.q, mode: "insensitive" },
          },
        }
      : undefined,
  };

  const [totalCount, items] = await Promise.all([
    prisma.booking.count({ where }),
    prisma.booking.findMany({
      where,
      include: {
        venue: { select: { id: true, name: true } },
        resource: { select: { id: true, name: true } },
        player: { select: { id: true, email: true, playerProfile: { select: { displayName: true, phone: true } } } },
      },
      orderBy: [{ startAt: "asc" }, { createdAt: "desc" }],
      skip: filters.skip,
      take: filters.take,
    }),
  ]);

  return { items, totalCount };
}

export async function listOwnerVenuesForFilter(ownerId: string) {
  return prisma.venue.findMany({
    where: { ownerId },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
}

export async function countOwnerPendingBookings(ownerId: string) {
  return prisma.booking.count({
    where: { venue: { ownerId }, status: BookingStatus.PENDING },
  });
}

export async function listPlayerBookings(
  playerId: string,
  filters: {
    status?: BookingStatus;
    q?: string;
    skip?: number;
    take?: number;
  } = {}
) {
  const where: Prisma.BookingWhereInput = {
    playerId,
    status: filters.status || undefined,
    venue: filters.q
      ? {
          name: { contains: filters.q, mode: "insensitive" },
        }
      : undefined,
  };

  const [totalCount, items] = await Promise.all([
    prisma.booking.count({ where }),
    prisma.booking.findMany({
      where,
      include: {
        venue: { select: { id: true, name: true, address: true } },
        resource: { select: { id: true, name: true } },
      },
      orderBy: [{ startAt: "desc" }, { createdAt: "desc" }],
      skip: filters.skip,
      take: filters.take,
    }),
  ]);

  return { items, totalCount };
}

export async function getOwnerBookingDetail(ownerId: string, bookingId: string) {
  const booking = await prisma.booking.findFirst({
    where: { id: bookingId, venue: { ownerId } },
    include: {
      venue: { select: { id: true, name: true, address: true } },
      resource: { select: { id: true, name: true } },
      player: { select: { id: true, email: true, playerProfile: { select: { displayName: true, phone: true } } } },
      statusHistory: { orderBy: { createdAt: "asc" } },
    },
  });

  return booking;
}

export async function getPlayerBookingDetail(playerId: string, bookingId: string) {
  const booking = await prisma.booking.findFirst({
    where: { id: bookingId, playerId },
    include: {
      venue: { select: { id: true, name: true, address: true, ownerId: true } },
      resource: { select: { id: true, name: true } },
      statusHistory: { orderBy: { createdAt: "asc" } },
    },
  });

  return booking;
}

export async function getOwnerDashboardData(ownerId: string, dateText: string) {
  const start = hanoiDateStartUtc(dateText);
  const end = hanoiDateEndUtc(dateText);
  const now = new Date();
  const todayStatuses = [BookingStatus.PENDING, BookingStatus.CONFIRMED];
  const upcomingStart = now > start && now < end ? now : start;

  const [venues, pendingGroups, todayGroups, availableSlotGroups, todayBookings, upcomingAvailableSlots] = await Promise.all([
    prisma.venue.findMany({
      where: { ownerId },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.booking.groupBy({
      by: ["venueId"],
      where: { venue: { ownerId }, status: BookingStatus.PENDING },
      _count: { _all: true },
    }),
    prisma.booking.groupBy({
      by: ["venueId"],
      where: { venue: { ownerId }, status: { in: todayStatuses }, startAt: { gte: start, lt: end } },
      _count: { _all: true },
    }),
    prisma.venueTimeSlot.groupBy({
      by: ["venueId"],
      where: { venue: { ownerId }, status: TimeSlotStatus.AVAILABLE, startAt: { gte: start, lt: end } },
      _count: { _all: true },
    }),
    prisma.booking.findMany({
      where: { venue: { ownerId }, status: { in: todayStatuses }, startAt: { gte: start, lt: end } },
      include: {
        venue: { select: { id: true, name: true } },
        resource: { select: { id: true, name: true } },
        player: { select: { id: true, email: true, playerProfile: { select: { displayName: true, phone: true } } } },
      },
      orderBy: [{ startAt: "asc" }],
      take: 50,
    }),
    prisma.venueTimeSlot.findMany({
      where: {
        venue: { ownerId },
        status: TimeSlotStatus.AVAILABLE,
        startAt: { gte: upcomingStart, lt: end },
        resource: { status: VenueResourceStatus.ACTIVE },
      },
      include: {
        venue: { select: { id: true, name: true } },
        resource: { select: { id: true, name: true } },
      },
      orderBy: [{ startAt: "asc" }, { venue: { name: "asc" } }, { resource: { sortOrder: "asc" } }],
      take: 24,
    }),
  ]);

  const pendingByVenue = new Map(pendingGroups.map((row) => [row.venueId, row._count._all]));
  const todayByVenue = new Map(todayGroups.map((row) => [row.venueId, row._count._all]));
  const availableByVenue = new Map(availableSlotGroups.map((row) => [row.venueId, row._count._all]));

  const perVenue = venues.map((venue) => ({
    venueId: venue.id,
    venueName: venue.name,
    pendingCount: pendingByVenue.get(venue.id) ?? 0,
    todayBookingCount: todayByVenue.get(venue.id) ?? 0,
    availableSlotCount: availableByVenue.get(venue.id) ?? 0,
  }));

  const sum = (values: IterableIterator<number>) => Array.from(values).reduce((total, value) => total + value, 0);

  return {
    date: dateText,
    totals: {
      pendingCount: sum(pendingByVenue.values()),
      todayBookingCount: sum(todayByVenue.values()),
      todayAvailableSlots: sum(availableByVenue.values()),
    },
    perVenue,
    todayBookings,
    upcomingAvailableSlots,
  };
}

export { activeBookingStatuses };
