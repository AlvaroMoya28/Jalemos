using JalemosBackend.Modules.Vehicles.Domain;
namespace JalemosBackend.Modules.Vehicles.Application;

public interface IVehiclesService
{
    Task<Vehicle?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<IEnumerable<Vehicle>> GetByUserIdAsync(Guid userId, CancellationToken cancellationToken = default);
    Task DeactivateAsync(Guid vehicleId, Guid requestingUserId, CancellationToken cancellationToken = default);
}
