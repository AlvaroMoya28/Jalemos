namespace JalemosBackend.Modules.Users.Domain
{
    public sealed class User
    {
        public Guid Id { get; set; }
        public string Username { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string? PasswordHash { get; set; }
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public UserRole Role { get; set; } = UserRole.passenger;
        public decimal MeanRating { get; set; }
        public int TotalTrips { get; set; }
        public decimal Kms { get; set; }
        public DateTime? SuspendedUntil { get; set; }
        public bool IsActive { get; set; } = true;
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }
}
