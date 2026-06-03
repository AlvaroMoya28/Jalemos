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
    public DateTime? BoardedAt { get; set; }
    public string? CancelReason { get; set; }
    public string? CancelDetails { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public void Cancel(string? reason = null, string? details = null)
    {
        State = BookingState.Cancelled;
        CancelReason = reason;
        CancelDetails = details;
        UpdatedAt = DateTime.UtcNow;
    }
    public void Confirm() { State = BookingState.Confirmed; UpdatedAt = DateTime.UtcNow; }
    public void Board() { State = BookingState.Boarded; BoardedAt = DateTime.UtcNow; UpdatedAt = DateTime.UtcNow; }
    public void MarkNoShow() { State = BookingState.NoShow; UpdatedAt = DateTime.UtcNow; }
    public void Complete() { State = BookingState.Completed; UpdatedAt = DateTime.UtcNow; }
}
