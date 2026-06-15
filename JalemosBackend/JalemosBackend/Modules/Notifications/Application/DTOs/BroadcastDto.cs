// Request payload for an admin broadcast (E1-5).
// Lets an admin push an announcement (promo, policy update, general notice) to a
// segment of users. The body is optional; the title is required.

using System.Text.Json.Serialization;

namespace JalemosBackend.Modules.Notifications.Application.DTOs;

/// <summary>
/// Target audience for a broadcast. Serialized as a string ("All"/"Passengers"/"Drivers")
/// so the mobile client can send the value by name (case-insensitive).
/// </summary>
[JsonConverter(typeof(JsonStringEnumConverter))]
public enum BroadcastSegment
{
    All,
    Passengers,
    Drivers,
}

public sealed class BroadcastDto
{
    public string Title { get; set; } = string.Empty;
    public string? Body { get; set; }
    public BroadcastSegment Segment { get; set; } = BroadcastSegment.All;
}

/// <summary>Result of a broadcast: how many users it reached.</summary>
public sealed class BroadcastResultDto
{
    public int Recipients { get; set; }
}
