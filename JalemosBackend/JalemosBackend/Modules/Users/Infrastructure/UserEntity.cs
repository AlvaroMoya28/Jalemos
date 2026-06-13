using JalemosBackend.Modules.Users.Domain;

namespace JalemosBackend.Modules.Users.Infrastructure
{
    // EF Core entity mapped to the "users" table. PasswordHash stores a bcrypt hash — never plain text.
    public class UserEntity
    {
        public Guid UserId { get; set; }
        public string Username { get; set; } = null!;
        public string Email { get; set; } = null!;
        public string PasswordHash { get; set; } = null!;
        public string FirstName { get; set; } = null!;
        public string LastName { get; set; } = null!;
        public UserRole Role { get; set; }
        public decimal MeanRating { get; set; }
        public int TotalTrips { get; set; }
        public int DriverTrips { get; set; }
        public decimal Kms { get; set; }
        public string? ProfilePhotoUrl { get; set; }
        public bool ProfilePhotoLocked { get; set; }
        public short? LicenseExpiryMonth { get; set; }
        public short? LicenseExpiryYear { get; set; }
        public short? DekraExpiryMonth { get; set; }
        public short? DekraExpiryYear { get; set; }
        public DateTime? SuspendedUntil { get; set; }
        public bool IsActive { get; set; }
        public Guid QrToken { get; set; }
        // Expo push token for this user's device (null until the app registers one).
        public string? ExpoPushToken { get; set; }
        // Per-type notification opt-in/out preferences as a JSON object, e.g. {"booking_received": false}.
        // Missing keys default to enabled. Critical safety notifications ignore this setting.
        public string? NotificationPrefs { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }
}
