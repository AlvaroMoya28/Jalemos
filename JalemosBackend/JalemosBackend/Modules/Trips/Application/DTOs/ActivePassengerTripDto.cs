namespace JalemosBackend.Modules.Trips.Application.DTOs;

/// <summary>Returned to a passenger when they have an active trip (boarding or in_progress).</summary>
public sealed class ActivePassengerTripDto
{
    public Guid TripId { get; set; }
    public string TripState { get; set; } = string.Empty;
    public string Origin { get; set; } = string.Empty;
    public string Destination { get; set; } = string.Empty;
    public decimal OriginLatitude { get; set; }
    public decimal OriginLongitude { get; set; }
    public decimal DestinationLatitude { get; set; }
    public decimal DestinationLongitude { get; set; }
    public DateTime DepartureAt { get; set; }
    public decimal Rate { get; set; }
    public Guid DriverId { get; set; }
    public string DriverFirstName { get; set; } = string.Empty;
    public string DriverLastName { get; set; } = string.Empty;
    public decimal DriverRating { get; set; }
    public DateTime? BoardingStartedAt { get; set; }
    public DateTime? JourneyStartedAt { get; set; }
    public DateTime? CancelledAt { get; set; }
    public string? CancelReason { get; set; }
    public string? CancelDetails { get; set; }
    /// <summary>True when cancellation happened within 60 minutes of departure (passenger can rate driver).</summary>
    public bool IsLateCancellation { get; set; }
    // Booking info for this passenger
    public Guid BookingId { get; set; }
    public string BookingState { get; set; } = string.Empty;
    public DateTime? BoardedAt { get; set; }
}
