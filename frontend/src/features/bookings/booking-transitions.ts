import { BookingStatus, TimeSlotStatus } from "@prisma/client";

/**
 * Logic chuyển trạng thái booking <-> slot, tách riêng dạng pure function
 * để kiểm thử không cần database.
 */

export type OwnerDecision = "confirm" | "reject" | "cancel";

type Transition = {
  bookingStatus: BookingStatus;
  slotStatus: TimeSlotStatus;
};

// Trạng thái slot khi một booking mới được tạo (Player vừa gửi yêu cầu).
export const SLOT_STATUS_ON_REQUEST = TimeSlotStatus.PENDING_CONFIRMATION;

// Quyết định của Chủ sân -> trạng thái booking + slot tương ứng.
export function ownerDecisionTransition(decision: OwnerDecision): Transition {
  switch (decision) {
    case "confirm":
      return { bookingStatus: BookingStatus.CONFIRMED, slotStatus: TimeSlotStatus.BOOKED };
    case "reject":
      return { bookingStatus: BookingStatus.REJECTED, slotStatus: TimeSlotStatus.AVAILABLE };
    case "cancel":
      return { bookingStatus: BookingStatus.CANCELED_BY_OWNER, slotStatus: TimeSlotStatus.AVAILABLE };
  }
}

// Player hủy -> trạng thái booking + slot tương ứng.
export function playerCancelTransition(): Transition {
  return { bookingStatus: BookingStatus.CANCELED_BY_PLAYER, slotStatus: TimeSlotStatus.AVAILABLE };
}

// Chủ sân chỉ được quyết định khi booking đang ở các trạng thái này.
export function ownerCanDecide(current: BookingStatus, decision: OwnerDecision): boolean {
  if (decision === "confirm" || decision === "reject") {
    return current === BookingStatus.PENDING;
  }
  // cancel: hủy booking đã xác nhận hoặc còn đang chờ.
  return current === BookingStatus.CONFIRMED || current === BookingStatus.PENDING;
}

// Player chỉ được hủy booking của mình khi còn PENDING hoặc CONFIRMED.
export function playerCanCancel(current: BookingStatus): boolean {
  return current === BookingStatus.PENDING || current === BookingStatus.CONFIRMED;
}
