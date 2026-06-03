namespace JalemosBackend.Modules.Trips.Application.DTOs;

public sealed class TripStatusDto
{
    public Guid TripId { get; set; }
    public string State { get; set; } = string.Empty;
    public string Origin { get; set; } = string.Empty;
    public string Destination { get; set; } = string.Empty;
    public decimal OriginLatitude { get; set; }
    public decimal OriginLongitude { get; set; }
    public decimal DestinationLatitude { get; set; }
    public decimal DestinationLongitude { get; set; }
    public DateTime DepartureAt { get; set; }
    public decimal Rate { get; set; }
    public string DriverFirstName { get; set; } = string.Empty;
    public string DriverLastName { get; set; } = string.Empty;
    public Guid DriverId { get; set; }
    public DateTime? BoardingStartedAt { get; set; }
    public DateTime? JourneyStartedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public DateTime? CancelledAt { get; set; }
    public string? CancelReason { get; set; }
    public string? CancelDetails { get; set; }
    public List<PassengerSummaryDto> Passengers { get; set; } = new();
}
