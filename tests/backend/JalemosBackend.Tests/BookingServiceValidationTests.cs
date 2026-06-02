using Microsoft.EntityFrameworkCore;
using JalemosBackend.Infrastructure.Persistence;
using JalemosBackend.Modules.Bookings.Application;
using JalemosBackend.Modules.Bookings.Infrastructure;

namespace JalemosBackend.Tests;

public class BookingServiceValidationTests
{
    private static BookingsService BuildService()
    {
        var opts = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        return new BookingsService(new BookingsRepository(new ApplicationDbContext(opts)));
    }

    [Fact]
    public async Task CreateAsync_NullDto_ThrowsArgumentNullException()
    {
        var svc = BuildService();

        await Assert.ThrowsAsync<ArgumentNullException>(() =>
            svc.CreateAsync(null!, Guid.NewGuid()));
    }

    [Fact]
    public async Task CreateAsync_EmptyTripId_ThrowsInvalidOperationException()
    {
        var svc = BuildService();
        var dto = new CreateBookingDto { TripId = Guid.Empty, SeatsReserved = 1 };

        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() =>
            svc.CreateAsync(dto, Guid.NewGuid()));

        Assert.Contains("tripId", ex.Message);
    }

    [Fact]
    public async Task CreateAsync_ZeroSeats_ThrowsInvalidOperationException()
    {
        var svc = BuildService();
        var dto = new CreateBookingDto { TripId = Guid.NewGuid(), SeatsReserved = 0 };

        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() =>
            svc.CreateAsync(dto, Guid.NewGuid()));

        Assert.Contains("seatsReserved", ex.Message);
    }

    [Fact]
    public async Task CreateAsync_NegativeSeats_ThrowsInvalidOperationException()
    {
        var svc = BuildService();
        var dto = new CreateBookingDto { TripId = Guid.NewGuid(), SeatsReserved = -3 };

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            svc.CreateAsync(dto, Guid.NewGuid()));
    }

    [Fact]
    public async Task UpdateAsync_NullBooking_ThrowsArgumentNullException()
    {
        var svc = BuildService();

        await Assert.ThrowsAsync<ArgumentNullException>(() =>
            svc.UpdateAsync(null!, Guid.NewGuid()));
    }

    [Fact]
    public async Task DeleteAsync_BookingDoesNotExist_CompletesWithoutException()
    {
        var svc = BuildService();

        var ex = await Record.ExceptionAsync(() =>
            svc.DeleteAsync(Guid.NewGuid(), Guid.NewGuid()));

        Assert.Null(ex);
    }
}
