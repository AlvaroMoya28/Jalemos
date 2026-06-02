using JalemosBackend.Infrastructure.Persistence;
using JalemosBackend.Modules.Bookings.Domain;
using JalemosBackend.Modules.Bookings.Infrastructure;

namespace JalemosBackend.Tests;

public class BookingsRepositoryMappingTests
{
    [Fact]
    public void MapToEntity_GeneratesIdAndTimestamps_WhenDefaultsAreUsed()
    {
        var booking = new Booking
        {
            TripId = Guid.NewGuid(),
            PassengerId = Guid.NewGuid(),
            SeatsReserved = 2,
            EstimatedAmount = 1550m,
            State = BookingState.Pending,
        };

        var before = DateTime.UtcNow;
        var entity = BookingsRepository.MapToEntity(booking);
        var after = DateTime.UtcNow;

        Assert.NotEqual(Guid.Empty, entity.BookingId);
        Assert.InRange(entity.CreatedAt, before, after);
        Assert.InRange(entity.UpdatedAt, before, after);
        Assert.Equal(booking.TripId, entity.TripId);
        Assert.Equal(booking.PassengerId, entity.PassengerId);
        Assert.Equal(booking.SeatsReserved, entity.SeatsReserved);
        Assert.Equal(booking.EstimatedAmount, entity.EstimatedAmount);
        Assert.Equal(booking.State, entity.State);
    }

    [Fact]
    public void MapToDomain_MapsAllFields()
    {
        var id = Guid.NewGuid();
        var createdAt = new DateTime(2026, 01, 01, 10, 0, 0, DateTimeKind.Utc);
        var updatedAt = createdAt.AddMinutes(8);
        var entity = new BookingEntity
        {
            BookingId = id,
            TripId = Guid.NewGuid(),
            PassengerId = Guid.NewGuid(),
            SeatsReserved = 3,
            EstimatedAmount = 4200m,
            State = BookingState.Confirmed,
            CreatedAt = createdAt,
            UpdatedAt = updatedAt,
        };

        var domain = BookingsRepository.MapToDomain(entity);

        Assert.Equal(entity.BookingId, domain.Id);
        Assert.Equal(entity.TripId, domain.TripId);
        Assert.Equal(entity.PassengerId, domain.PassengerId);
        Assert.Equal(entity.SeatsReserved, domain.SeatsReserved);
        Assert.Equal(entity.EstimatedAmount, domain.EstimatedAmount);
        Assert.Equal(entity.State, domain.State);
        Assert.Equal(entity.CreatedAt, domain.CreatedAt);
        Assert.Equal(entity.UpdatedAt, domain.UpdatedAt);
    }

    [Fact]
    public void MapToEntity_PreservesExistingId_WhenIdIsNotEmpty()
    {
        var existingId = Guid.NewGuid();
        var booking = new Booking
        {
            Id = existingId,
            TripId = Guid.NewGuid(),
            PassengerId = Guid.NewGuid(),
            SeatsReserved = 2,
            EstimatedAmount = 750m,
            State = BookingState.Confirmed,
        };

        var entity = BookingsRepository.MapToEntity(booking);

        Assert.Equal(existingId, entity.BookingId);
    }

    [Fact]
    public void MapToEntity_PreservesExistingTimestamps_WhenAlreadySet()
    {
        var created = new DateTime(2026, 01, 15, 8, 0, 0, DateTimeKind.Utc);
        var updated = new DateTime(2026, 02, 20, 12, 0, 0, DateTimeKind.Utc);
        var booking = new Booking
        {
            TripId = Guid.NewGuid(),
            PassengerId = Guid.NewGuid(),
            SeatsReserved = 1,
            EstimatedAmount = 500m,
            State = BookingState.Confirmed,
            CreatedAt = created,
            UpdatedAt = updated,
        };

        var entity = BookingsRepository.MapToEntity(booking);

        Assert.Equal(created, entity.CreatedAt);
        Assert.Equal(updated, entity.UpdatedAt);
    }
}
