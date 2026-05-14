// Este archivo representa el acceso a datos del módulo Bookings.
// Aquí deberían implementarse las consultas a la base de datos compartida.

using JalemosBackend.Infrastructure.Persistence;
using JalemosBackend.Modules.Bookings.Domain;

namespace JalemosBackend.Modules.Bookings.Infrastructure;

public sealed class BookingsRepository
{
    private readonly ApplicationDbContext _dbContext;

    public BookingsRepository(ApplicationDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public Task<IEnumerable<Booking>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return Task.FromResult<IEnumerable<Booking>>(Array.Empty<Booking>());
    }

    public Task<Booking?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return Task.FromResult<Booking?>(null);
    }

    public Task CreateAsync(Booking booking, CancellationToken cancellationToken = default)
    {
        return Task.CompletedTask;
    }

    public Task UpdateAsync(Booking booking, CancellationToken cancellationToken = default)
    {
        return Task.CompletedTask;
    }

    public Task DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return Task.CompletedTask;
    }
}
