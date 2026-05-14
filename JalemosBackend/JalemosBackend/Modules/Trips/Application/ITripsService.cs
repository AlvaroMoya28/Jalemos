// Este archivo define el contrato de aplicación del módulo Rides.
// Aquí deberían declararse los casos de uso que consumirá el controlador.

using JalemosBackend.Modules.Rides.Domain;

namespace JalemosBackend.Modules.Rides.Application;

public interface ITripsService
{
    // TODO: agregar casos de uso reales para consultar, crear, actualizar y eliminar viajes.
    Task<IEnumerable<Trip>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<Trip?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task CreateAsync(Trip ride, CancellationToken cancellationToken = default);
    Task UpdateAsync(Trip ride, CancellationToken cancellationToken = default);
    Task DeleteAsync(Guid id, CancellationToken cancellationToken = default);
}
