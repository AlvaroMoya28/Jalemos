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
    public string Origin { get; set; }
    public string Destination { get; set; }
    public DateTime DepartureAt { get; set; }
    public short TotalSeats { get; set; }
    public short AvailableSeats { get; set; }
    public TripState State { get; set; }
    public DateTime CreatedAt { get; set; }
    public string Notes { get; set; }


}
