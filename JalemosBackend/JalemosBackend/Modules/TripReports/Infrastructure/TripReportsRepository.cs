using Microsoft.EntityFrameworkCore;
using JalemosBackend.Infrastructure.Persistence;
using JalemosBackend.Modules.TripReports.Domain;

namespace JalemosBackend.Modules.TripReports.Infrastructure;

public sealed class TripReportsRepository
{
    private readonly ApplicationDbContext _db;

    public TripReportsRepository(ApplicationDbContext db) => _db = db;

    public async Task<TripReport> CreateAsync(TripReport report, CancellationToken ct = default)
    {
        var entity = ToEntity(report);
        _db.TripReports.Add(entity);
        await _db.SaveChangesAsync(ct);
        report.Id = entity.ReportId;
        return report;
    }

    public async Task<IReadOnlyList<TripReport>> GetAllAsync(
        TripReportStatus? status = null, int skip = 0, int take = 50, CancellationToken ct = default)
    {
        var query = _db.TripReports.AsNoTracking().AsQueryable();
        if (status.HasValue) query = query.Where(r => r.Status == status.Value);
        var rows = await query
            .OrderByDescending(r => r.CreatedAt)
            .Skip(skip).Take(take)
            .ToListAsync(ct);
        return rows.Select(ToDomain).ToList();
    }

    public async Task<TripReport?> GetByIdAsync(Guid id, CancellationToken ct = default)
    {
        var entity = await _db.TripReports.AsNoTracking()
            .FirstOrDefaultAsync(r => r.ReportId == id, ct);
        return entity is null ? null : ToDomain(entity);
    }

    public async Task UpdateAsync(TripReport report, CancellationToken ct = default)
    {
        var entity = await _db.TripReports.FirstOrDefaultAsync(r => r.ReportId == report.Id, ct)
            ?? throw new KeyNotFoundException("Reporte no encontrado.");
        entity.Status = report.Status;
        entity.AdminNotes = report.AdminNotes;
        entity.ResolvedAt = report.ResolvedAt;
        entity.UpdatedAt = report.UpdatedAt;
        await _db.SaveChangesAsync(ct);
    }

    private static TripReportEntity ToEntity(TripReport r) => new()
    {
        ReportId    = r.Id == Guid.Empty ? Guid.NewGuid() : r.Id,
        TripId      = r.TripId,
        DriverId    = r.DriverId,
        ReporterId  = r.ReporterId,
        Type        = r.Type,
        Status      = r.Status,
        Description = r.Description,
        AdminNotes  = r.AdminNotes,
        ResolvedAt  = r.ResolvedAt,
        CreatedAt   = r.CreatedAt,
        UpdatedAt   = r.UpdatedAt,
    };

    private static TripReport ToDomain(TripReportEntity e) => new()
    {
        Id          = e.ReportId,
        TripId      = e.TripId,
        DriverId    = e.DriverId,
        ReporterId  = e.ReporterId,
        Type        = e.Type,
        Status      = e.Status,
        Description = e.Description,
        AdminNotes  = e.AdminNotes,
        ResolvedAt  = e.ResolvedAt,
        CreatedAt   = e.CreatedAt,
        UpdatedAt   = e.UpdatedAt,
    };
}
