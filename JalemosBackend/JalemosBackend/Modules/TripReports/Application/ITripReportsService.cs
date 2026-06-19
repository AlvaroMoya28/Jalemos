using JalemosBackend.Infrastructure.Persistence;
using JalemosBackend.Modules.TripReports.Application.DTOs;

namespace JalemosBackend.Modules.TripReports.Application;

public interface ITripReportsService
{
    /// <summary>Passenger creates a report during an active trip. Notifies all admins.</summary>
    Task<TripReportDto> CreateAsync(CreateTripReportDto dto, Guid callerId, CancellationToken ct = default);

    /// <summary>Admin: paginated list of reports, optionally filtered by status.</summary>
    Task<IReadOnlyList<TripReportDto>> GetAllAsync(
        TripReportStatus? status = null, int page = 1, int pageSize = 50, CancellationToken ct = default);

    /// <summary>Admin: single report by id.</summary>
    Task<TripReportDto?> GetByIdAsync(Guid id, CancellationToken ct = default);

    /// <summary>Admin: transition the report status (verified / dismissed / action_taken).</summary>
    Task<TripReportDto> UpdateStatusAsync(Guid id, UpdateTripReportStatusDto dto, CancellationToken ct = default);
}
