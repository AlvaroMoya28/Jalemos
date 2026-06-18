// Application contract for the Users module.
// Declares the user management use cases exposed to the presentation layer.

using JalemosBackend.Modules.Users.Application.DTOs;
using JalemosBackend.Modules.Users.Domain;

namespace JalemosBackend.Modules.Users.Application;

/// <summary>
/// Defines user management use cases: listing, fetching, registering, updating, and removing users.
/// </summary>
public interface IUsersService
{
    /// <summary>Returns all registered users.</summary>
    Task<IEnumerable<User>> GetAllAsync(CancellationToken cancellationToken = default);

    /// <summary>Returns the user with the specified id, or null if not found.</summary>
    Task<User?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);

    /// <summary>Returns a paginated, filtered, sorted list of users for admin management.</summary>
    Task<PagedUsersResponse> GetPagedAsync(UserQueryParams queryParams, CancellationToken cancellationToken = default);

    /// <summary>Registers a new user after validating email uniqueness and required fields.</summary>
    Task CreateAsync(User user, CancellationToken cancellationToken = default);

    /// <summary>Updates an existing user's profile data.</summary>
    Task UpdateAsync(User user, CancellationToken cancellationToken = default);

    /// <summary>Removes the user account with the specified identifier.</summary>
    Task DeleteAsync(Guid id, CancellationToken cancellationToken = default);

    /// <summary>Changes the role of a user (admin action).</summary>
    Task ChangeRoleAsync(Guid id, string role, CancellationToken cancellationToken = default);

    /// <summary>Suspends a user for the given number of days. 0 = permanent.</summary>
    Task BanAsync(Guid id, int days, CancellationToken cancellationToken = default);

    /// <summary>Lifts an active suspension from a user.</summary>
    Task LiftBanAsync(Guid id, CancellationToken cancellationToken = default);

    /// <summary>Deactivates a user account (sets is_active = false).</summary>
    Task DeactivateAsync(Guid id, CancellationToken cancellationToken = default);

    /// <summary>Reactivates a user account and clears any suspension.</summary>
    Task ActivateAsync(Guid id, CancellationToken cancellationToken = default);

    /// <summary>Uploads a new profile photo (base64) to storage and saves its URL. Returns the new URL.
    /// Throws if the user's photo is locked (set from driver verification).</summary>
    Task<string> UpdateProfilePhotoAsync(Guid id, string base64, CancellationToken cancellationToken = default);

    /// <summary>Emails the user their boarding QR. Enforces a 5-minute cooldown.
    /// Throws QrEmailCooldownException if called again too soon.</summary>
    Task SendBoardingQrEmailAsync(Guid id, CancellationToken cancellationToken = default);
}
