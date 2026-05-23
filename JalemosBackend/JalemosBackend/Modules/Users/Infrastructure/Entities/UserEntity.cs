using JalemosBackend.Modules.Users.Domain;

namespace JalemosBackend.Modules.Users.Infrastructure.Entities
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
        public decimal Kms { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }
}
