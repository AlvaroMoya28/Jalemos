// Domain entity for the Trips (Rides) module.
// Holds all business rules and state for a single offered trip.
using JalemosBackend.Infrastructure.Persistence;
namespace JalemosBackend.Modules.Trips.Domain;


/// <summary>
/// Represents a trip offered by a driver, including route, schedule, capacity, and price.
/// </summary>
public sealed class Trip
{
    public Guid Id { get; set; }
    public Guid DriverId { get; set; }
    public Guid VehicleId { get; set; }
    public decimal Rate { get; set; }
    public string Origin { get; set; } = string.Empty;
    public string Destination { get; set; } = string.Empty;

    public decimal OriginLatitude { get; set; }
    public decimal OriginLongitude { get; set; }
    public decimal DestinationLatitude { get; set; }
    public decimal DestinationLongitude { get; set; }

    public DateTime DepartureAt { get; set; }
    public short TotalSeats { get; set; }
    public short AvailableSeats { get; set; }
    public TripState State { get; set; }
    public DateTime? BoardingStartedAt { get; set; }
    public DateTime? JourneyStartedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public DateTime? CancelledAt { get; set; }
    public string? CancelReason { get; set; }
    public string? CancelDetails { get; set; }
    public DateTime CreatedAt { get; set; }
    public string Notes { get; set; } = string.Empty;


}
