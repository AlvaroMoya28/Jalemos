using JalemosBackend.Infrastructure.Persistence;

namespace JalemosBackend.Modules.Notifications.Infrastructure;

public class NotificationEntity
{
    public Guid NotificationId { get; set; }
    public Guid UserId { get; set; }
    public Guid? TripId { get; set; }
    public Guid? BookingId { get; set; }
    public NotificationType Type { get; set; }
    public string Title { get; set; } = null!;
    public string? Body { get; set; }
    public bool Read { get; set; }
    // Which role-mode this notification is meant for: "all" | "passenger" | "driver".
    // The feed filters by the user's current mode so a passenger+driver only sees the
    // notifications relevant to the mode they're in (plus "all").
    public string Audience { get; set; } = "all";
    public DateTime CreatedAt { get; set; }
}
