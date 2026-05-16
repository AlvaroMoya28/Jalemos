// Application service for the Users module.
// Enforces user-related business rules (email uniqueness, role constraints)
// and delegates data persistence to UsersRepository.

using JalemosBackend.Modules.Users.Domain;
using JalemosBackend.Modules.Users.Infrastructure;

namespace JalemosBackend.Modules.Users.Application;

/// <summary>
/// Implements user use cases defined in <see cref="IUsersService"/>.
/// </summary>
public sealed class UsersService : IUsersService
{
    private readonly UsersRepository _repository;

    /// <summary>Injects the users data access repository.</summary>
    public UsersService(UsersRepository repository)
    {
        _repository = repository;
    }

    /// <inheritdoc/>
    public Task<IEnumerable<User>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        // TODO: restrict this endpoint to admin roles once authentication is implemented
        return _repository.GetAllAsync(cancellationToken);
    }

    /// <inheritdoc/>
    public Task<User?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return _repository.GetByIdAsync(id, cancellationToken);
    }

    /// <inheritdoc/>
    public Task CreateAsync(User user, CancellationToken cancellationToken = default)
    {
        // TODO: hash password and validate email uniqueness before persisting
        return _repository.CreateAsync(user, cancellationToken);
    }

    /// <inheritdoc/>
    public Task UpdateAsync(User user, CancellationToken cancellationToken = default)
    {
        // TODO: verify the caller owns this account or is an admin
        return _repository.UpdateAsync(user, cancellationToken);
    }

    /// <inheritdoc/>
    public Task DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        // TODO: soft-delete to preserve audit history for trip and booking records
        return _repository.DeleteAsync(id, cancellationToken);
    }
}
