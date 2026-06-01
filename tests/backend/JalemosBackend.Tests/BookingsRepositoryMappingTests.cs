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
}
