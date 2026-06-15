// Read model returned by the Notifications API to the mobile client.
// Type is exposed as a snake_case string (e.g. "booking_received") so the frontend
// can map it to an icon/label without knowing the C# enum.

namespace JalemosBackend.Modules.Notifications.Application.DTOs;

public sealed class NotificationDto
{
    public Guid Id { get; set; }
    public string Type { get; set; } = "general";
    public string Title { get; set; } = string.Empty;
    public string? Body { get; set; }
    public Guid? TripId { get; set; }
    public Guid? BookingId { get; set; }
    public bool Read { get; set; }
    public string Audience { get; set; } = "all";
    public DateTime CreatedAt { get; set; }
}
