// Este archivo contiene la lógica de aplicación del módulo Rides.
// Aquí deberían coordinarse reglas de negocio, validaciones y acceso al repositorio.

using JalemosBackend.Modules.Rides.Domain;
using JalemosBackend.Modules.Rides.Infrastructure;

namespace JalemosBackend.Modules.Rides.Application;

public sealed class TripsService : ITripsService
{
    private readonly TripsRepository _repository;

    public TripsService(TripsRepository repository)
    {
        _repository = repository;
    }

    public Task<IEnumerable<Trip>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        // TODO: invocar el repositorio y aplicar reglas de negocio del módulo.
        return _repository.GetAllAsync(cancellationToken);
    }

    public Task<Trip?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        // TODO: consultar un viaje específico.
        return _repository.GetByIdAsync(id, cancellationToken);
    }

    public Task CreateAsync(Trip ride, CancellationToken cancellationToken = default)
    {
        // TODO: validar y persistir un viaje nuevo.
        return _repository.CreateAsync(ride, cancellationToken);
    }

    public Task UpdateAsync(Trip ride, CancellationToken cancellationToken = default)
    {
        // TODO: validar y actualizar un viaje existente.
        return _repository.UpdateAsync(ride, cancellationToken);
    }

    public Task DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        // TODO: eliminar un viaje.
        return _repository.DeleteAsync(id, cancellationToken);
    }
}
