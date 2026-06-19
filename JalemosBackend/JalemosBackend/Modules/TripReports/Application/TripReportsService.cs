using Microsoft.EntityFrameworkCore;
using JalemosBackend.Infrastructure.Persistence;
using JalemosBackend.Modules.Notifications.Infrastructure;
using JalemosBackend.Modules.TripReports.Application.DTOs;
using JalemosBackend.Modules.TripReports.Domain;
using JalemosBackend.Modules.TripReports.Infrastructure;
using JalemosBackend.Modules.Users.Domain;
using JalemosBackend.Modules.Users.Infrastructure;

namespace JalemosBackend.Modules.TripReports.Application;

public sealed class TripReportsService : ITripReportsService
{
    private readonly TripReportsRepository _repository;
    private readonly ApplicationDbContext _db;

    public TripReportsService(TripReportsRepository repository, ApplicationDbContext db)
    {
        _repository = repository;
        _db         = db;
    }

    public async Task<TripReportDto> CreateAsync(CreateTripReportDto dto, Guid callerId, CancellationToken ct = default)
    {
        if (dto is null) throw new ArgumentNullException(nameof(dto));
        if (dto.TripId == Guid.Empty) throw new InvalidOperationException("tripId es requerido.");
        if (string.IsNullOrWhiteSpace(dto.Description)) throw new InvalidOperationException("La descripción es requerida.");
        if (!TryParseType(dto.Type, out var reportType)) throw new InvalidOperationException("Tipo de reporte inválido. Use 'emergency' o 'driver_report'.");

        var trip = await _db.Trips.AsNoTracking().FirstOrDefaultAsync(t => t.TripId == dto.TripId, ct)
            ?? throw new KeyNotFoundException("Viaje no encontrado.");

        // Emergency reports require an active trip; driver_reports are also allowed after the trip ends.
        var tripIsActive    = trip.State == TripState.InProgress;
        var tripIsCompleted = trip.State == TripState.Completed;
        if (!tripIsActive && !(tripIsCompleted && reportType == TripReportType.DriverReport))
            throw new InvalidOperationException("Los reportes de emergencia solo se permiten durante un viaje en curso. Los reportes al conductor también se permiten tras finalizar el viaje.");

        var now = DateTime.UtcNow;
        var report = new TripReport
        {
            TripId      = dto.TripId,
            DriverId    = trip.DriverUserId,
            ReporterId  = callerId,
            Type        = reportType,
            Status      = TripReportStatus.Open,
            Description = dto.Description.Trim(),
            CreatedAt   = now,
            UpdatedAt   = now,
        };

        await _repository.CreateAsync(report, ct);

        // Notify all admins so they can act in real time (E3-1 requirement).
        var reporter = await _db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.UserId == callerId, ct);
        var reporterName = reporter is null ? "Un pasajero" : $"{reporter.FirstName} {reporter.LastName}";
        var title = reportType == TripReportType.Emergency
            ? $"EMERGENCIA en viaje — {reporterName}"
            : $"Reporte al conductor — {reporterName}";
        var body = dto.Description.Length > 120
            ? dto.Description[..120] + "…"
            : dto.Description;

        var adminIds = await _db.Users.AsNoTracking()
            .Where(u => u.IsActive && u.Role == UserRole.admin)
            .Select(u => u.UserId)
            .ToListAsync(ct);

        foreach (var adminId in adminIds)
        {
            _db.Notifications.Add(new NotificationEntity
            {
                UserId  = adminId,
                TripId  = trip.TripId,
                Type    = NotificationType.EmergencyReport,
                Title   = title,
                Body    = body,
                Audience = "all",
            });
        }

        if (adminIds.Count > 0) await _db.SaveChangesAsync(ct);

        return ToDto(report);
    }

    public async Task<IReadOnlyList<TripReportDto>> GetAllAsync(
        TripReportStatus? status = null, int page = 1, int pageSize = 50, CancellationToken ct = default)
    {
        page     = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 200);
        var reports = await _repository.GetAllAsync(status, (page - 1) * pageSize, pageSize, ct);

        var userIds = reports.SelectMany(r => new[] { r.DriverId, r.ReporterId }).Distinct().ToList();
        var userMap = await _db.Users.AsNoTracking()
            .Where(u => userIds.Contains(u.UserId))
            .ToDictionaryAsync(u => u.UserId, ct);

        return reports.Select(r => ToDto(r, userMap)).ToList();
    }

    public async Task<TripReportDto?> GetByIdAsync(Guid id, CancellationToken ct = default)
    {
        var report = await _repository.GetByIdAsync(id, ct);
        if (report is null) return null;

        var userIds = new[] { report.DriverId, report.ReporterId };
        var userMap = await _db.Users.AsNoTracking()
            .Where(u => userIds.Contains(u.UserId))
            .ToDictionaryAsync(u => u.UserId, ct);

        return ToDto(report, userMap);
    }

    public async Task<TripReportDto> UpdateStatusAsync(Guid id, UpdateTripReportStatusDto dto, CancellationToken ct = default)
    {
        if (dto is null) throw new ArgumentNullException(nameof(dto));
        if (!TryParseStatus(dto.Status, out var newStatus)) throw new InvalidOperationException("Estado inválido. Use 'verified', 'dismissed' o 'action_taken'.");

        var report = await _repository.GetByIdAsync(id, ct)
            ?? throw new KeyNotFoundException("Reporte no encontrado.");

        if (report.Status == TripReportStatus.Open && newStatus == TripReportStatus.Open)
            throw new InvalidOperationException("El reporte ya está en estado 'open'.");

        switch (newStatus)
        {
            case TripReportStatus.Verified:    report.Verify(dto.AdminNotes);     break;
            case TripReportStatus.Dismissed:   report.Dismiss(dto.AdminNotes);    break;
            case TripReportStatus.ActionTaken: report.TakeAction(dto.AdminNotes); break;
            default: throw new InvalidOperationException("Transición de estado no permitida.");
        }

        await _repository.UpdateAsync(report, ct);
        return ToDto(report);
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private static TripReportDto ToDto(TripReport r,
        Dictionary<Guid, UserEntity>? userMap = null)
    {
        var driver   = userMap?.GetValueOrDefault(r.DriverId);
        var reporter = userMap?.GetValueOrDefault(r.ReporterId);
        return new()
        {
            Id           = r.Id,
            TripId       = r.TripId,
            DriverId     = r.DriverId,
            ReporterId   = r.ReporterId,
            DriverName   = driver   is null ? null : $"{driver.FirstName} {driver.LastName}",
            ReporterName = reporter is null ? null : $"{reporter.FirstName} {reporter.LastName}",
            Type         = r.Type == TripReportType.Emergency ? "emergency" : "driver_report",
            Status       = StatusStr(r.Status),
            Description  = r.Description,
            AdminNotes   = r.AdminNotes,
            ResolvedAt   = r.ResolvedAt,
            CreatedAt    = r.CreatedAt,
            UpdatedAt    = r.UpdatedAt,
        };
    }

    private static string StatusStr(TripReportStatus s) => s switch
    {
        TripReportStatus.Open        => "open",
        TripReportStatus.Verified    => "verified",
        TripReportStatus.Dismissed   => "dismissed",
        TripReportStatus.ActionTaken => "action_taken",
        _                            => s.ToString().ToLower(),
    };

    private static bool TryParseType(string raw, out TripReportType result)
    {
        result = raw?.Trim().ToLower() switch
        {
            "emergency"     => TripReportType.Emergency,
            "driver_report" => TripReportType.DriverReport,
            _               => default,
        };
        return raw?.Trim().ToLower() is "emergency" or "driver_report";
    }

    private static bool TryParseStatus(string raw, out TripReportStatus result)
    {
        result = raw?.Trim().ToLower() switch
        {
            "verified"     => TripReportStatus.Verified,
            "dismissed"    => TripReportStatus.Dismissed,
            "action_taken" => TripReportStatus.ActionTaken,
            _              => default,
        };
        return raw?.Trim().ToLower() is "verified" or "dismissed" or "action_taken";
    }
}
