using JalemosBackend.Infrastructure.Persistence;
using JalemosBackend.Modules.Bookings.Domain;

namespace JalemosBackend.Tests;

public class BookingDomainBehaviorTests
{
    [Fact]
    public void Confirm_SetsStateAndUpdatedAt()
    {
        var booking = new Booking
        {
            State = BookingState.Pending,
            UpdatedAt = DateTime.MinValue,
        };

        booking.Confirm();

        Assert.Equal(BookingState.Confirmed, booking.State);
        Assert.NotEqual(DateTime.MinValue, booking.UpdatedAt);
    }

    [Fact]
    public void Cancel_SetsStateAndUpdatedAt()
    {
        var booking = new Booking
        {
            State = BookingState.Pending,
            UpdatedAt = DateTime.MinValue,
        };

        booking.Cancel();

        Assert.Equal(BookingState.Cancelled, booking.State);
        Assert.NotEqual(DateTime.MinValue, booking.UpdatedAt);
    }
}
