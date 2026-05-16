// Shared data access context used by all feature modules.
// When a real database is wired up, replace this stub with an EF Core DbContext
// that exposes DbSet<T> properties for each aggregate (Trips, Users, Bookings, Notifications, Ratings).

namespace JalemosBackend.Infrastructure.Persistence;

/// <summary>
/// Central EF Core (or equivalent) context shared across all domain modules.
/// Registered as a singleton so a single connection pool is reused for the lifetime of the process.
/// </summary>
public sealed class ApplicationDbContext
{
    // TODO: Add DbSet<Trip>, DbSet<User>, DbSet<Booking>, DbSet<Notification>, DbSet<Rating>
    //       and configure connection string via IConfiguration.
}
