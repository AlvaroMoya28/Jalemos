// Domain entity for the Trips (Rides) module.
// Holds all business rules and state for a single offered trip.

namespace JalemosBackend.Modules.Rides.Domain;

/// <summary>
/// Represents a trip offered by a driver, including route, schedule, capacity, and price.
/// </summary>
public sealed class Trip
{
    // TODO: Add DriverId, Origin, Destination, DepartureAt, AvailableSeats, PricePerSeat,
    //       IsRecurring, Status (Draft/Published/Completed/Cancelled),
    //       and domain methods such as Publish(), Cancel(), BookSeat().
    public Guid Id { get; set; }
}
