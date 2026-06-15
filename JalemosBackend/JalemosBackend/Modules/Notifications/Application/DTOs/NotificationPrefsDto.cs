// Per-user notification preferences (E1-6) and push-token registration (E1-3).

namespace JalemosBackend.Modules.Notifications.Application.DTOs;

/// <summary>
/// Opt-in/out map keyed by the snake_case notification type (e.g. "booking_received").
/// A missing or true value means the type is enabled. Critical safety types are always sent.
/// </summary>
public sealed class NotificationPrefsDto
{
    public Dictionary<string, bool> Preferences { get; set; } = new();
}

/// <summary>Payload to register/refresh this device's Expo push token.</summary>
public sealed class RegisterPushTokenDto
{
    public string? Token { get; set; }
}
