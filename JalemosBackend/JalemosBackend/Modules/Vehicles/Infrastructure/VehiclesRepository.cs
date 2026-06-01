using JalemosBackend.Infrastructure.Persistence;
using JalemosBackend.Modules.Vehicles.Domain;
using Microsoft.EntityFrameworkCore;

namespace JalemosBackend.Modules.Vehicles.Infrastructure;

public sealed class VehiclesRepository
{
    private readonly ApplicationDbContext _dbContext;
    public VehiclesRepository(ApplicationDbContext dbContext) => _dbContext = dbContext;

    private static Vehicle MapToDomain(VehicleEntity e) => new Vehicle
    {
        VehicleId = e.VehicleId,
        UserId    = e.UserId,
        Brand     = e.Brand,
        Model     = e.Model,
        Year      = e.Year,
        NumPlate  = e.NumPlate,
        Color     = e.Color,
        Active    = e.Active,
        CreatedAt = e.CreatedAt,
    };

    public async Task<Vehicle?> GetByIdAsync(Guid id, CancellationToken ct = default)
    {
        var entity = await _dbContext.Vehicles.AsNoTracking()
            .FirstOrDefaultAsync(x => x.VehicleId == id, ct);
        return entity is null ? null : MapToDomain(entity);
    }

    public async Task<IEnumerable<Vehicle>> GetByUserIdAsync(Guid userId, CancellationToken ct = default) =>
        await _dbContext.Vehicles.AsNoTracking()
            .Where(x => x.UserId == userId && x.Active)
            .Select(e => MapToDomain(e))
            .ToListAsync(ct);

    public async Task DeactivateAsync(Guid vehicleId, Guid requestingUserId, CancellationToken ct = default)
    {
        var entity = await _dbContext.Vehicles
            .FirstOrDefaultAsync(v => v.VehicleId == vehicleId, ct)
            ?? throw new KeyNotFoundException("Vehículo no encontrado.");

        if (entity.UserId != requestingUserId)
            throw new UnauthorizedAccessException("No tenés permiso para eliminar este vehículo.");

        if (!entity.Active)
            throw new InvalidOperationException("El vehículo ya estaba eliminado.");

        entity.Active = false;
        await _dbContext.SaveChangesAsync(ct);
    }
}
