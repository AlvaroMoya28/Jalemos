namespace JalemosBackend.Modules.Trips.Application.DTOs;

public sealed class PassengerSummaryDto
{
    public Guid BookingId { get; set; }
    public Guid PassengerId { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public short SeatsReserved { get; set; }
    public string BookingState { get; set; } = string.Empty;
    public DateTime? BoardedAt { get; set; }
}
