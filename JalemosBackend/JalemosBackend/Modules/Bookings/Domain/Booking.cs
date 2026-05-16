// Domain entity for the Bookings module.
// Encapsulates all data and business rules that belong to a single ride reservation.

namespace JalemosBackend.Modules.Bookings.Domain;

/// <summary>
/// Represents a passenger's reservation for a specific trip.
/// </summary>
public sealed class Booking
{
    // TODO: Add UserId, TripId, Status (Pending/Confirmed/Cancelled), BookedAt, SeatsReserved,
    //       and domain validation methods (e.g., Cancel(), Confirm()).
    public Guid Id { get; set; }
}
