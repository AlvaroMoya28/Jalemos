// Este archivo contiene la lógica de aplicación del módulo Ratings.
// Aquí deberían coordinarse validaciones y reglas del negocio de calificaciones.

using JalemosBackend.Modules.Ratings.Domain;
using JalemosBackend.Modules.Ratings.Infrastructure;

namespace JalemosBackend.Modules.Ratings.Application;

public sealed class RatingsService : IRatingsService
{
    private readonly RatingsRepository _repository;

    public RatingsService(RatingsRepository repository)
    {
        _repository = repository;
    }

    public Task<IEnumerable<Rating>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return _repository.GetAllAsync(cancellationToken);
    }

    public Task<Rating?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return _repository.GetByIdAsync(id, cancellationToken);
    }

    public Task CreateAsync(Rating rating, CancellationToken cancellationToken = default)
    {
        return _repository.CreateAsync(rating, cancellationToken);
    }

    public Task UpdateAsync(Rating rating, CancellationToken cancellationToken = default)
    {
        return _repository.UpdateAsync(rating, cancellationToken);
    }

    public Task DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return _repository.DeleteAsync(id, cancellationToken);
    }
}
