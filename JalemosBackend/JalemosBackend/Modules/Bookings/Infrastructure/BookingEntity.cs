using JalemosBackend.Infrastructure.Persistence;

namespace JalemosBackend.Modules.Bookings.Infrastructure;

public class BookingEntity
{
    public Guid BookingId { get; set; }
    public Guid TripId { get; set; }
    public Guid PassengerId { get; set; }
    public short SeatsReserved { get; set; }
    public decimal EstimatedAmount { get; set; }
    public BookingState State { get; set; }
    public DateTime? BoardedAt { get; set; }
    public string? CancelReason { get; set; }
    public string? CancelDetails { get; set; }
    public bool IsLateCancel { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
