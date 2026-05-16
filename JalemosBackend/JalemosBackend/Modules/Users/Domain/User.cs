// Domain entity for the Users module.
// Represents a registered Jalemos user who can act as a driver, a passenger, or both.

namespace JalemosBackend.Modules.Users.Domain;

/// <summary>
/// Represents an application user with profile data and role information.
/// </summary>
public sealed class User
{
    // TODO: Add FullName, Email, PhoneNumber, Role (Driver/Passenger/Both),
    //       AvatarUrl, AverageRating, TotalTrips, and domain validation methods
    //       such as Verify() and UpdateProfile().
    public Guid Id { get; set; }
}
