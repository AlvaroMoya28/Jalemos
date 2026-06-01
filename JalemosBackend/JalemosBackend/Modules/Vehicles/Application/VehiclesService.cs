using JalemosBackend.Modules.Vehicles.Domain;
using JalemosBackend.Modules.Vehicles.Infrastructure;

namespace JalemosBackend.Modules.Vehicles.Application;

public sealed class VehiclesService : IVehiclesService
{
    private readonly VehiclesRepository _repository;
    public VehiclesService(VehiclesRepository repository) => _repository = repository;

    public Task<Vehicle?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
        => _repository.GetByIdAsync(id, cancellationToken);

    public Task<IEnumerable<Vehicle>> GetByUserIdAsync(Guid userId, CancellationToken cancellationToken = default)
        => _repository.GetByUserIdAsync(userId, cancellationToken);

    public Task DeactivateAsync(Guid vehicleId, Guid requestingUserId, CancellationToken cancellationToken = default)
        => _repository.DeactivateAsync(vehicleId, requestingUserId, cancellationToken);
}
