# Bookings Feature

Owns court booking without online payment and keeps slot availability in sync with booking status.

- Players request `AVAILABLE` slots; the slot is atomically claimed to `PENDING_CONFIRMATION` to prevent double-booking.
- Venue Owners confirm (slot `BOOKED`), reject (slot back to `AVAILABLE`), or cancel a confirmed booking.
- Players can cancel their own `PENDING` or `CONFIRMED` bookings.
- Each transition creates an in-app notification for the other party.

Slot/booking state transitions live in `booking-transitions.ts` as pure functions so they can be unit tested without a database.
