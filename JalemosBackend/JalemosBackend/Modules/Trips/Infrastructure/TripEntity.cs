using JalemosBackend.Infrastructure.Persistence;

namespace JalemosBackend.Modules.Trips.Infrastructure;

public class TripEntity
{
    public Guid TripId { get; set; }
    public Guid DriverUserId { get; set; }
    public Guid VehicleId { get; set; }
    public decimal Rate { get; set; }
    public string FromLocation { get; set; } = null!;
    public string ToLocation { get; set; } = null!;
    public decimal FromLatitude { get; set; }
    public decimal FromLongitude { get; set; }
    public decimal ToLatitude { get; set; }
    public decimal ToLongitude { get; set; }
    public DateTime StartDateTime { get; set; }
    public short TotalSeats { get; set; }
    public short AvailableSeats { get; set; }
    public string? Notes { get; set; }
    public TripState State { get; set; }
    public DateTime? BoardingStartedAt { get; set; }
    public DateTime? JourneyStartedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public DateTime? CancelledAt { get; set; }
    public string? CancelReason { get; set; }
    public string? CancelDetails { get; set; }
    public DateTime CreatedAt { get; set; }
}
