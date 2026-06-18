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
        public string? ExpoPushToken { get; set; }
        public string? NotificationPrefs { get; set; }
        public string? StripeCustomerId { get; set; }
        public Guid? LastUsedPaymentMethodId { get; set; }
        public string? EmailVerificationCode { get; set; }
        public DateTime? EmailVerificationExpiresAt { get; set; }
        public bool IsEmailVerified { get; set; }
        public DateTime? QrEmailLastSentAt { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }
}
