using System;

namespace JalemosBackend.Modules.Users.Infrastructure.Entities
{
    public class UserEntity
    {
        public Guid UserId { get; set; }
        public string Name { get; set; } = null!;
        public string Email { get; set; } = null!;
        public string Password { get; set; } = null!;
        public decimal MeanRating { get; set; }
        public int TotalTrips { get; set; }
        public decimal Kms { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }
}
