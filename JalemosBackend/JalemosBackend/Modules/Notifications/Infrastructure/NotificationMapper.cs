// Maps between the NotificationType enum and the snake_case string the API/DB use,
// and turns persisted NotificationEntity rows into API DTOs.

using JalemosBackend.Infrastructure.Persistence;
using JalemosBackend.Modules.Notifications.Application.DTOs;

namespace JalemosBackend.Modules.Notifications.Infrastructure;

public static class NotificationMapper
{
    /// <summary>Notification types that must always be delivered, ignoring user opt-out.</summary>
    public static readonly IReadOnlySet<NotificationType> CriticalTypes = new HashSet<NotificationType>
    {
        NotificationType.DriverCancelled,
        NotificationType.PassengerCancelled,
        NotificationType.NoShowMarked,
    };

    /// <summary>Converts an enum value to its snake_case wire name (BookingReceived → "booking_received").</summary>
    public static string ToSnake(NotificationType type)
    {
        var name = type.ToString();
        var sb = new System.Text.StringBuilder(name.Length + 4);
        for (var i = 0; i < name.Length; i++)
        {
            var c = name[i];
            if (char.IsUpper(c) && i > 0) sb.Append('_');
            sb.Append(char.ToLowerInvariant(c));
        }
        return sb.ToString();
    }

    public static NotificationDto ToDto(NotificationEntity e) => new()
    {
        Id        = e.NotificationId,
        Type      = ToSnake(e.Type),
        Title     = e.Title,
        Body      = e.Body,
        TripId    = e.TripId,
        BookingId = e.BookingId,
        Read      = e.Read,
        Audience  = e.Audience,
        CreatedAt = e.CreatedAt,
    };
}
