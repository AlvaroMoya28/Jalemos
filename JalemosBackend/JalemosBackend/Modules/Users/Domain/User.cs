using System;

namespace JalemosBackend.Modules.Users.Domain
{
    public sealed class User
    {
        public Guid Id { get; set; }

        // Profile information
        public string Name { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;

        // TODO: the password should be hashed in the service layer
        public string? PasswordHash { get; set; }

        // Metrics
        public decimal MeanRating { get; set; }
        public int TotalTrips { get; set; }
        public decimal Kms { get; set; }

        // Datetime fields
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }
}