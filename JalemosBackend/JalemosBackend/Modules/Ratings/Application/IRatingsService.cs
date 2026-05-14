// Este archivo define el contrato de aplicación del módulo Ratings.
// Aquí deberían declararse los casos de uso de calificaciones.

using JalemosBackend.Modules.Ratings.Domain;

namespace JalemosBackend.Modules.Ratings.Application;

public interface IRatingsService
{
    // TODO: agregar casos de uso reales para calificaciones.
    Task<IEnumerable<Rating>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<Rating?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task CreateAsync(Rating rating, CancellationToken cancellationToken = default);
    Task UpdateAsync(Rating rating, CancellationToken cancellationToken = default);
    Task DeleteAsync(Guid id, CancellationToken cancellationToken = default);
}
