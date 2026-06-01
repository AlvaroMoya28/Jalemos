using JalemosBackend.Infrastructure.Persistence;
using JalemosBackend.Modules.Trips.Domain;
using JalemosBackend.Modules.Trips.Infrastructure;

namespace JalemosBackend.Tests;

public class TripsRepositoryMappingTests
{
    [Fact]
    public void MapToDomain_UsesEmptyStringWhenNotesIsNull()
    {
        var entity = new TripEntity
        {
            TripId = Guid.NewGuid(),
            DriverUserId = Guid.NewGuid(),
            VehicleId = Guid.NewGuid(),
            Rate = 1750m,
            FromLocation = "San Pedro",
            ToLocation = "Heredia",
            FromLatitude = 9.93m,
            FromLongitude = -84.05m,
            ToLatitude = 10.00m,
            ToLongitude = -84.11m,
            StartDateTime = new DateTime(2026, 05, 01, 8, 0, 0, DateTimeKind.Utc),
            TotalSeats = 4,
            AvailableSeats = 2,
            State = TripState.Scheduled,
            CreatedAt = new DateTime(2026, 04, 28, 13, 0, 0, DateTimeKind.Utc),
            Notes = null,
        };

        var domain = TripsRepository.MapToDomain(entity);

        Assert.Equal(string.Empty, domain.Notes);
        Assert.Equal(entity.TripId, domain.Id);
        Assert.Equal(entity.DriverUserId, domain.DriverId);
        Assert.Equal(entity.VehicleId, domain.VehicleId);
        Assert.Equal(entity.Rate, domain.Rate);
        Assert.Equal(entity.FromLocation, domain.Origin);
        Assert.Equal(entity.ToLocation, domain.Destination);
    }

    [Fact]
    public void MapToEntity_MapsCoordinatesAndNotes()
    {
        var trip = new Trip
        {
            Id = Guid.NewGuid(),
            DriverId = Guid.NewGuid(),
            VehicleId = Guid.NewGuid(),
            Rate = 999m,
            Origin = "A",
            Destination = "B",
            OriginLatitude = 1.1m,
            OriginLongitude = 2.2m,
            DestinationLatitude = 3.3m,
            DestinationLongitude = 4.4m,
            DepartureAt = new DateTime(2026, 07, 10, 14, 30, 0, DateTimeKind.Utc),
            TotalSeats = 5,
            AvailableSeats = 4,
            State = TripState.InProgress,
            CreatedAt = new DateTime(2026, 07, 10, 9, 0, 0, DateTimeKind.Utc),
            Notes = "Parada en UCR",
        };

        var entity = TripsRepository.MapToEntity(trip);

        Assert.Equal(trip.Id, entity.TripId);
        Assert.Equal(trip.DriverId, entity.DriverUserId);
        Assert.Equal(trip.VehicleId, entity.VehicleId);
        Assert.Equal(trip.OriginLatitude, entity.FromLatitude);
        Assert.Equal(trip.OriginLongitude, entity.FromLongitude);
        Assert.Equal(trip.DestinationLatitude, entity.ToLatitude);
        Assert.Equal(trip.DestinationLongitude, entity.ToLongitude);
        Assert.Equal(trip.Notes, entity.Notes);
        Assert.Equal(trip.State, entity.State);
    }
}
