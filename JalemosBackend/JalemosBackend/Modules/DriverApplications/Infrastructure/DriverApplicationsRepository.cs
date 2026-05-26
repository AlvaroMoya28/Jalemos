using JalemosBackend.Infrastructure.Persistence;
using JalemosBackend.Modules.Users.Domain;
using Microsoft.EntityFrameworkCore;

namespace JalemosBackend.Modules.DriverApplications.Infrastructure;

public sealed class DriverApplicationsRepository
{
    private readonly ApplicationDbContext _db;

    public DriverApplicationsRepository(ApplicationDbContext db) => _db = db;

    public async Task<DriverApplicationEntity?> GetLatestByUserAsync(Guid userId, CancellationToken ct) =>
        await _db.DriverApplications
            .AsNoTracking()
            .Where(a => a.UserId == userId)
            .OrderByDescending(a => a.SubmittedAt)
            .FirstOrDefaultAsync(ct);

    public async Task<List<DriverApplicationEntity>> GetAllAsync(ApplicationStatus? status, CancellationToken ct)
    {
        var q = _db.DriverApplications.AsNoTracking();
        if (status.HasValue) q = q.Where(a => a.Status == status.Value);
        return await q.OrderByDescending(a => a.SubmittedAt).ToListAsync(ct);
    }

    public async Task<DriverApplicationEntity?> GetByIdAsync(Guid id, CancellationToken ct) =>
        await _db.DriverApplications.AsNoTracking().FirstOrDefaultAsync(a => a.ApplicationId == id, ct);

    public async Task<DriverApplicationEntity> CreateAsync(DriverApplicationEntity entity, CancellationToken ct)
    {
        _db.DriverApplications.Add(entity);
        await _db.SaveChangesAsync(ct);
        return entity;
    }

    public async Task UpdateAsync(DriverApplicationEntity entity, CancellationToken ct)
    {
        _db.DriverApplications.Update(entity);
        await _db.SaveChangesAsync(ct);
    }

    // Returns the user's first_name + last_name and email for response enrichment
    public async Task<(string FullName, string Email)?> GetApplicantInfoAsync(Guid userId, CancellationToken ct)
    {
        var user = await _db.Users
            .AsNoTracking()
            .Where(u => u.UserId == userId)
            .Select(u => new { u.FirstName, u.LastName, u.Email })
            .FirstOrDefaultAsync(ct);

        return user is null ? null : ($"{user.FirstName} {user.LastName}", user.Email);
    }

    // Sets user.role = 'driver' when an application is approved
    public async Task PromoteToDriverAsync(Guid userId, CancellationToken ct)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.UserId == userId, ct);
        if (user is null) return;
        user.Role = UserRole.driver;
        user.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
    }
}
