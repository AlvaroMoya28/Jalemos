// Este archivo representa el acceso a datos del módulo Ratings.
// Aquí deberían implementarse las consultas a la base de datos compartida.

using JalemosBackend.Infrastructure.Persistence;
using JalemosBackend.Modules.Ratings.Domain;

namespace JalemosBackend.Modules.Ratings.Infrastructure;

public sealed class RatingsRepository
{
    private readonly ApplicationDbContext _dbContext;

    public RatingsRepository(ApplicationDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public Task<IEnumerable<Rating>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return Task.FromResult<IEnumerable<Rating>>(Array.Empty<Rating>());
    }

    public Task<Rating?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return Task.FromResult<Rating?>(null);
    }

    public Task CreateAsync(Rating rating, CancellationToken cancellationToken = default)
    {
        return Task.CompletedTask;
    }

    public Task UpdateAsync(Rating rating, CancellationToken cancellationToken = default)
    {
        return Task.CompletedTask;
    }

    public Task DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return Task.CompletedTask;
    }
}
