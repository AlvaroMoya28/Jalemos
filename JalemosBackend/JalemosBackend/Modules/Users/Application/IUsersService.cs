// Application contract for the Users module.
// Declares the user management use cases exposed to the presentation layer.

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

    /// <summary>Registers a new user after validating email uniqueness and required fields.</summary>
    Task CreateAsync(User user, CancellationToken cancellationToken = default);

    /// <summary>Updates an existing user's profile data.</summary>
    Task UpdateAsync(User user, CancellationToken cancellationToken = default);

    /// <summary>Removes the user account with the specified identifier.</summary>
    Task DeleteAsync(Guid id, CancellationToken cancellationToken = default);
}
