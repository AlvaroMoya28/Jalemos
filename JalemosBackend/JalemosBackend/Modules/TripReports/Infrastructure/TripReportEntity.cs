using JalemosBackend.Infrastructure.Persistence;

namespace JalemosBackend.Modules.TripReports.Infrastructure;

public class TripReportEntity
{
    public Guid ReportId { get; set; }
    public Guid TripId { get; set; }
    public Guid DriverId { get; set; }
    public Guid ReporterId { get; set; }
    public TripReportType Type { get; set; }
    public TripReportStatus Status { get; set; }
    public string Description { get; set; } = null!;
    public string? AdminNotes { get; set; }
    public DateTime? ResolvedAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
