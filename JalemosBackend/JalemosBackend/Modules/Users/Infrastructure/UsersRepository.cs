// Data access layer for the Users module.
// Provides raw CRUD operations against the users table in the shared database.

using JalemosBackend.Infrastructure.Persistence;
using JalemosBackend.Modules.Users.Domain;

namespace JalemosBackend.Modules.Users.Infrastructure;

/// <summary>
/// Executes database queries for <see cref="User"/> entities.
/// All methods return stubs until ApplicationDbContext exposes a real DbSet&lt;User&gt;.
/// </summary>
public sealed class UsersRepository
{
    private readonly ApplicationDbContext _dbContext;

    /// <summary>Receives the shared database context via constructor injection.</summary>
    public UsersRepository(ApplicationDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    /// <summary>Returns all user records. Replace with <c>_dbContext.Users.ToListAsync()</c>.</summary>
    public Task<IEnumerable<User>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return Task.FromResult<IEnumerable<User>>(Array.Empty<User>());
    }

    /// <summary>Finds a user by primary key. Returns null if not found.</summary>
    public Task<User?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return Task.FromResult<User?>(null);
    }

    /// <summary>Inserts a new user row.</summary>
    public Task CreateAsync(User user, CancellationToken cancellationToken = default)
    {
        // TODO: _dbContext.Users.Add(user); await _dbContext.SaveChangesAsync(cancellationToken);
        return Task.CompletedTask;
    }

    /// <summary>Updates an existing user row.</summary>
    public Task UpdateAsync(User user, CancellationToken cancellationToken = default)
    {
        // TODO: _dbContext.Users.Update(user); await _dbContext.SaveChangesAsync(cancellationToken);
        return Task.CompletedTask;
    }

    /// <summary>Deletes the user row with the specified id.</summary>
    public Task DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        // TODO: find entity by id, call Remove(), then SaveChangesAsync
        return Task.CompletedTask;
    }
}
