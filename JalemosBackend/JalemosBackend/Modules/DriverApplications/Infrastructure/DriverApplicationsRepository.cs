using JalemosBackend.Infrastructure.Persistence;
using JalemosBackend.Modules.Users.Domain;
using JalemosBackend.Modules.Vehicles.Infrastructure;
using Microsoft.EntityFrameworkCore;

namespace JalemosBackend.Modules.DriverApplications.Infrastructure;

public sealed class DriverApplicationsRepository
{
    private readonly ApplicationDbContext _db;

    public DriverApplicationsRepository(ApplicationDbContext db) => _db = db;

    public async Task<DriverApplicationEntity?> GetLatestByUserAsync(Guid userId, CancellationToken ct) =>
        await _db.DriverApplications
            .AsNoTracking()
            .Where(a => a.UserId == userId && a.ApplicationType == "driver")
            .OrderByDescending(a => a.SubmittedAt)
            .FirstOrDefaultAsync(ct);

    public async Task<List<DriverApplicationEntity>> GetMyVehicleApplicationsAsync(Guid userId, CancellationToken ct) =>
        await _db.DriverApplications
            .AsNoTracking()
            .Where(a => a.UserId == userId && a.ApplicationType == "vehicle")
            .OrderByDescending(a => a.SubmittedAt)
            .ToListAsync(ct);

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

    // Sets user.role = 'driver', copies face photo as locked profile photo, copies expiry dates
    public async Task PromoteToDriverAsync(Guid userId, string? facePhotoUrl,
        short? licenseMonth, short? licenseYear, short? dekraMonth, short? dekraYear,
        CancellationToken ct)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.UserId == userId, ct);
        if (user is null) return;
        user.Role      = UserRole.driver;
        user.UpdatedAt = DateTime.UtcNow;
        if (!string.IsNullOrWhiteSpace(facePhotoUrl))
        {
            user.ProfilePhotoUrl    = facePhotoUrl;
            user.ProfilePhotoLocked = true;
        }
        user.LicenseExpiryMonth = licenseMonth;
        user.LicenseExpiryYear  = licenseYear;
        user.DekraExpiryMonth   = dekraMonth;
        user.DekraExpiryYear    = dekraYear;
        await _db.SaveChangesAsync(ct);
    }

    // Creates a new vehicle for an existing driver (used when admin approves a 'vehicle' application)
    public async Task CreateVehicleForUserAsync(Guid userId, string brand, string model,
        short year, string plate, string color, CancellationToken ct)
    {
        _db.Vehicles.Add(new VehicleEntity
        {
            VehicleId = Guid.NewGuid(),
            UserId    = userId,
            Brand     = brand,
            Model     = model,
            Year      = year,
            NumPlate  = plate,
            Color     = color,
            Active    = true,
            CreatedAt = DateTime.UtcNow,
        });
        await _db.SaveChangesAsync(ct);
    }

    // Updates only the document photos and expiry dates (used when admin approves a renewal)
    public async Task UpdateDocumentsAsync(Guid userId,
        string? licensePhotoFront, string? licensePhotoBack, string? dekraPhoto,
        short? licenseMonth, short? licenseYear, short? dekraMonth, short? dekraYear,
        CancellationToken ct)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.UserId == userId, ct);
        if (user is null) return;
        user.UpdatedAt = DateTime.UtcNow;
        if (!string.IsNullOrWhiteSpace(licenseMonth.ToString())) user.LicenseExpiryMonth = licenseMonth;
        if (!string.IsNullOrWhiteSpace(licenseYear.ToString()))  user.LicenseExpiryYear  = licenseYear;
        if (!string.IsNullOrWhiteSpace(dekraMonth.ToString()))   user.DekraExpiryMonth   = dekraMonth;
        if (!string.IsNullOrWhiteSpace(dekraYear.ToString()))    user.DekraExpiryYear    = dekraYear;
        await _db.SaveChangesAsync(ct);
    }
}
