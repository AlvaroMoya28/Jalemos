// Este archivo representa el acceso a datos del módulo Users.
// Aquí deberían implementarse las consultas a la base de datos compartida.

using JalemosBackend.Infrastructure.Persistence;
using JalemosBackend.Modules.Users.Domain;

namespace JalemosBackend.Modules.Users.Infrastructure;

public sealed class UsersRepository
{
    private readonly ApplicationDbContext _dbContext;

    public UsersRepository(ApplicationDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public Task<IEnumerable<User>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return Task.FromResult<IEnumerable<User>>(Array.Empty<User>());
    }

    public Task<User?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return Task.FromResult<User?>(null);
    }

    public Task CreateAsync(User user, CancellationToken cancellationToken = default)
    {
        return Task.CompletedTask;
    }

    public Task UpdateAsync(User user, CancellationToken cancellationToken = default)
    {
        return Task.CompletedTask;
    }

    public Task DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return Task.CompletedTask;
    }
}
