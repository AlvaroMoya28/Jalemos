namespace JalemosBackend.Modules.Bookings.Application.DTOs;

/// <summary>
/// DTO returned to clients representing a booking.
/// </summary>
public sealed class BookingDto
{
    public Guid Id { get; set; }
    public Guid TripId { get; set; }
    public Guid PassengerId { get; set; }
    public short SeatsReserved { get; set; }
    public decimal EstimatedAmount { get; set; }
    public string State { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}
