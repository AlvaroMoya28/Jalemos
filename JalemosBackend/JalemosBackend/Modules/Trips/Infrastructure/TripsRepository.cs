// Este archivo representa el acceso a datos del módulo Rides.
// Aquí deberían implementarse las consultas contra la base de datos compartida.

using JalemosBackend.Infrastructure.Persistence;
using JalemosBackend.Modules.Rides.Domain;

namespace JalemosBackend.Modules.Rides.Infrastructure;

public sealed class TripsRepository
{
    private readonly ApplicationDbContext _dbContext;

    public TripsRepository(ApplicationDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public Task<IEnumerable<Trip>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        // TODO: leer viajes desde la base de datos común.
        return Task.FromResult<IEnumerable<Trip>>(Array.Empty<Trip>());
    }

    public Task<Trip?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        // TODO: buscar un viaje por identificador.
        return Task.FromResult<Trip?>(null);
    }

    public Task CreateAsync(Trip ride, CancellationToken cancellationToken = default)
    {
        // TODO: guardar el viaje en la base de datos.
        return Task.CompletedTask;
    }

    public Task UpdateAsync(Trip ride, CancellationToken cancellationToken = default)
    {
        // TODO: actualizar el viaje en la base de datos.
        return Task.CompletedTask;
    }

    public Task DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        // TODO: eliminar el viaje de la base de datos.
        return Task.CompletedTask;
    }
}
