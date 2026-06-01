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
}
