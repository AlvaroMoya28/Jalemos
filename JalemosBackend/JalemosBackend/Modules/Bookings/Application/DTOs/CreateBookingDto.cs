namespace JalemosBackend.Modules.Bookings.Application.DTOs;

/// <summary>
/// DTO used by clients to create a new booking.
/// </summary>
public sealed class CreateBookingDto
{
    public Guid TripId { get; set; }
    public short SeatsReserved { get; set; }
    public decimal? EstimatedAmount { get; set; }
}
