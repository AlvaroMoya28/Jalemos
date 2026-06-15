using JalemosBackend.Infrastructure.Persistence;
using JalemosBackend.Modules.Notifications.Application;
using JalemosBackend.Modules.Notifications.Infrastructure;

namespace JalemosBackend.Tests;

// Input/output tests for the notification mapping and preference parsing — the
// logic the push interceptor and the API rely on. (Epic 1: E1-1, E1-3, E1-6.)
public class NotificationMappingTests
{
    [Theory]
    [InlineData(NotificationType.BookingReceived, "booking_received")]
    [InlineData(NotificationType.General, "general")]
    [InlineData(NotificationType.PassengerCancelled, "passenger_cancelled")]
    [InlineData(NotificationType.NoShowMarked, "no_show_marked")]
    [InlineData(NotificationType.AdminBroadcast, "admin_broadcast")]
    public void ToSnake_ConvertsEnumToWireName(NotificationType type, string expected)
    {
        Assert.Equal(expected, NotificationMapper.ToSnake(type));
    }

    [Fact]
    public void ToDto_MapsEveryField_AndSnakeCasesType()
    {
        var id        = Guid.NewGuid();
        var tripId    = Guid.NewGuid();
        var bookingId = Guid.NewGuid();
        var createdAt = new DateTime(2026, 06, 08, 9, 30, 0, DateTimeKind.Utc);

        var entity = new NotificationEntity
        {
            NotificationId = id,
            UserId         = Guid.NewGuid(),
            TripId         = tripId,
            BookingId      = bookingId,
            Type           = NotificationType.BookingReceived,
            Title          = "Reservaron un espacio",
            Body           = "San José → Cartago",
            Read           = true,
            CreatedAt      = createdAt,
        };

        var dto = NotificationMapper.ToDto(entity);

        Assert.Equal(id, dto.Id);
        Assert.Equal("booking_received", dto.Type);
        Assert.Equal("Reservaron un espacio", dto.Title);
        Assert.Equal("San José → Cartago", dto.Body);
        Assert.Equal(tripId, dto.TripId);
        Assert.Equal(bookingId, dto.BookingId);
        Assert.True(dto.Read);
        Assert.Equal(createdAt, dto.CreatedAt);
    }

    [Fact]
    public void CriticalTypes_AreNotOptOutable()
    {
        Assert.Contains(NotificationType.DriverCancelled, NotificationMapper.CriticalTypes);
        Assert.Contains(NotificationType.PassengerCancelled, NotificationMapper.CriticalTypes);
        Assert.Contains(NotificationType.NoShowMarked, NotificationMapper.CriticalTypes);
        // Promotional/informational types remain opt-outable.
        Assert.DoesNotContain(NotificationType.AdminBroadcast, NotificationMapper.CriticalTypes);
        Assert.DoesNotContain(NotificationType.BookingReceived, NotificationMapper.CriticalTypes);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData("not-json")]
    [InlineData("[1,2,3]")]
    public void ParsePrefs_ReturnsEmpty_ForMissingOrInvalidJson(string? json)
    {
        Assert.Empty(NotificationsService.ParsePrefs(json));
    }

    [Fact]
    public void ParsePrefs_ReadsFlagMap()
    {
        var prefs = NotificationsService.ParsePrefs("{\"booking_received\":false,\"admin_broadcast\":true}");

        Assert.False(prefs["booking_received"]);
        Assert.True(prefs["admin_broadcast"]);
        Assert.Equal(2, prefs.Count);
    }
}
