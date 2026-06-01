// Domain entity for the Bookings module.
// Encapsulates all data and business rules that belong to a single ride reservation.

using JalemosBackend.Infrastructure.Persistence;

namespace JalemosBackend.Modules.Bookings.Domain;

/// <summary>
/// Represents a passenger's reservation for a specific trip.
/// </summary>
public sealed class Booking
{
    public Guid Id { get; set; }
    public Guid TripId { get; set; }
    public Guid PassengerId { get; set; }
    public short SeatsReserved { get; set; }
    public decimal EstimatedAmount { get; set; }
    public BookingState State { get; set; } = BookingState.Pending;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    // Helpers: mark as cancelled and confirmed
    public void Cancel()
    {
        State = BookingState.Cancelled;
        UpdatedAt = DateTime.UtcNow;
    }
    public void Confirm()
    {
        State = BookingState.Confirmed;
        UpdatedAt = DateTime.UtcNow;
    }
}
