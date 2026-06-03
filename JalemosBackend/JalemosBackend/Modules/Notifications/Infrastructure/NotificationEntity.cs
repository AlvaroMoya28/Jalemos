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
    public DateTime CreatedAt { get; set; }
}
