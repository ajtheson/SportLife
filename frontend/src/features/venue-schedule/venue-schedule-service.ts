import { TimeSlotStatus, VenueResourceStatus } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";

import { editableTimeSlotStatuses } from "./venue-schedule-schemas";
import type {
  GenerateVenueSlotsInput,
  ToggleVenueSlotInput,
  VenueResourceInput,
  VenueScheduleRuleInput,
} from "./venue-schedule-schemas";

export const weekdayLabels = ["Chủ nhật", "Thứ hai", "Thứ ba", "Thứ tư", "Thứ năm", "Thứ sáu", "Thứ bảy"];

export const defaultScheduleRules = weekdayLabels.map((_, dayOfWeek) => ({
  dayOfWeek,
  isOpen: dayOfWeek !== 0,
  startTime: "06:00",
  endTime: "22:00",
  slotDurationMinutes: 60,
}));

function dateParts(dateText: string) {
  const [year, month, day] = dateText.split("-").map(Number);
  return { year, month: month - 1, day };
}

function hanoiDateTimeToUtc(dateText: string, timeText: string) {
  const { year, month, day } = dateParts(dateText);
  const [hour, minute] = timeText.split(":").map(Number);
  return new Date(Date.UTC(year, month, day, hour - 7, minute, 0, 0));
}

function hanoiDateStartUtc(dateText: string) {
  return hanoiDateTimeToUtc(dateText, "00:00");
}

function hanoiDateEndUtc(dateText: string) {
  const { year, month, day } = dateParts(dateText);
  return new Date(Date.UTC(year, month, day + 1, -7, 0, 0, 0));
}

export { hanoiDateTimeToUtc, hanoiDateStartUtc, hanoiDateEndUtc };

function hanoiDayOfWeek(dateText: string) {
  const { year, month, day } = dateParts(dateText);
  return new Date(Date.UTC(year, month, day, 12, 0, 0, 0)).getUTCDay();
}

function addMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * 60_000);
}

function summarizeOpeningHours(rules: VenueScheduleRuleInput[]) {
  const openRules = rules
    .filter((rule) => rule.isOpen)
    .sort((a, b) => a.dayOfWeek - b.dayOfWeek)
    .map((rule) => `${weekdayLabels[rule.dayOfWeek]} ${rule.startTime}-${rule.endTime}`);

  return openRules.length > 0 ? { text: openRules.join("; ") } : { text: "Chưa mở lịch hoạt động" };
}

async function assertOwnerVenue(ownerId: string, venueId: string) {
  const venue = await prisma.venue.findFirst({
    where: { id: venueId, ownerId },
    select: { id: true, name: true, ownerId: true },
  });

  if (!venue) {
    throw new Error("VENUE_NOT_FOUND");
  }

  return venue;
}

export async function getOwnerVenueScheduleData(ownerId: string, venueId: string, dateText: string) {
  const venue = await prisma.venue.findFirst({
    where: { id: venueId, ownerId },
    select: { id: true, name: true, address: true, approvalStatus: true, visibilityStatus: true },
  });

  if (!venue) {
    return null;
  }

  const [resources, savedRules, slots] = await Promise.all([
    prisma.venueResource.findMany({
      where: { venueId },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    }),
    prisma.venueScheduleRule.findMany({
      where: { venueId },
      orderBy: { dayOfWeek: "asc" },
    }),
    prisma.venueTimeSlot.findMany({
      where: {
        venueId,
        startAt: { gte: hanoiDateStartUtc(dateText), lt: hanoiDateEndUtc(dateText) },
      },
      include: { resource: true },
      orderBy: [{ startAt: "asc" }, { resource: { sortOrder: "asc" } }],
    }),
  ]);

  const rulesByDay = new Map(savedRules.map((rule) => [rule.dayOfWeek, rule]));
  const rules = defaultScheduleRules.map((rule) => rulesByDay.get(rule.dayOfWeek) ?? rule);

  return { venue, resources, rules, slots, selectedDate: dateText };
}

export async function saveVenueResource(ownerId: string, input: VenueResourceInput) {
  await assertOwnerVenue(ownerId, input.venueId);

  const data = {
    name: input.name,
    description: input.description || null,
    status: input.status,
    sortOrder: input.sortOrder,
  };

  if (input.resourceId) {
    const existing = await prisma.venueResource.findFirst({
      where: { id: input.resourceId, venueId: input.venueId },
      select: { id: true },
    });

    if (!existing) {
      throw new Error("RESOURCE_NOT_FOUND");
    }

    await prisma.venueResource.update({ where: { id: input.resourceId }, data });
    return;
  }

  await prisma.venueResource.create({
    data: {
      venueId: input.venueId,
      ...data,
    },
  });
}

export async function saveVenueScheduleRule(ownerId: string, input: VenueScheduleRuleInput) {
  await assertOwnerVenue(ownerId, input.venueId);

  await prisma.$transaction(async (tx) => {
    await tx.venueScheduleRule.upsert({
      where: {
        venueId_dayOfWeek: {
          venueId: input.venueId,
          dayOfWeek: input.dayOfWeek,
        },
      },
      update: {
        isOpen: input.isOpen,
        startTime: input.startTime,
        endTime: input.endTime,
        slotDurationMinutes: input.slotDurationMinutes,
      },
      create: input,
    });

    const rules = await tx.venueScheduleRule.findMany({ where: { venueId: input.venueId } });
    await tx.venue.update({
      where: { id: input.venueId },
      data: { openingHours: summarizeOpeningHours(rules) },
    });
  });
}

export async function generateVenueSlots(ownerId: string, input: GenerateVenueSlotsInput) {
  await assertOwnerVenue(ownerId, input.venueId);

  const [resources, rule] = await Promise.all([
    prisma.venueResource.findMany({
      where: { venueId: input.venueId, status: VenueResourceStatus.ACTIVE },
      select: { id: true },
    }),
    prisma.venueScheduleRule.findUnique({
      where: {
        venueId_dayOfWeek: {
          venueId: input.venueId,
          dayOfWeek: hanoiDayOfWeek(input.date),
        },
      },
    }),
  ]);

  const effectiveRule = rule ?? defaultScheduleRules[hanoiDayOfWeek(input.date)];

  if (!effectiveRule.isOpen || resources.length === 0) {
    return { created: 0 };
  }

  const startAt = hanoiDateTimeToUtc(input.date, effectiveRule.startTime);
  const endAt = hanoiDateTimeToUtc(input.date, effectiveRule.endTime);
  const slots = [];

  for (const resource of resources) {
    for (let cursor = startAt; addMinutes(cursor, effectiveRule.slotDurationMinutes) <= endAt; cursor = addMinutes(cursor, effectiveRule.slotDurationMinutes)) {
      slots.push({
        venueId: input.venueId,
        resourceId: resource.id,
        startAt: cursor,
        endAt: addMinutes(cursor, effectiveRule.slotDurationMinutes),
        generatedDate: hanoiDateStartUtc(input.date),
        status: TimeSlotStatus.AVAILABLE,
      });
    }
  }

  const result = await prisma.venueTimeSlot.createMany({ data: slots, skipDuplicates: true });
  return { created: result.count };
}

export async function toggleVenueSlot(ownerId: string, input: ToggleVenueSlotInput) {
  await assertOwnerVenue(ownerId, input.venueId);

  const slot = await prisma.venueTimeSlot.findFirst({
    where: { id: input.slotId, venueId: input.venueId },
    select: { id: true, status: true },
  });

  if (!slot) {
    throw new Error("SLOT_NOT_FOUND");
  }

  if (!editableTimeSlotStatuses.has(slot.status)) {
    throw new Error("SLOT_NOT_EDITABLE");
  }

  await prisma.venueTimeSlot.update({
    where: { id: input.slotId },
    data:
      input.action === "block"
        ? { status: TimeSlotStatus.BLOCKED, blockReason: input.blockReason || "Chủ sân khóa thủ công" }
        : { status: TimeSlotStatus.AVAILABLE, blockReason: null },
  });
}
