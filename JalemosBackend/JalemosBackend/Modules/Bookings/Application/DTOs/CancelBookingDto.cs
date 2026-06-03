namespace JalemosBackend.Modules.Bookings.Application.DTOs;

public sealed class CancelBookingDto
{
    /// <summary>Short reason: plans_changed, found_alternative, personal_emergency, other</summary>
    public string Reason { get; set; } = "other";
    public string? Details { get; set; }
}
