using JalemosBackend.Infrastructure.Persistence;

namespace JalemosBackend.Modules.TripReports.Domain;

public sealed class TripReport
{
    public Guid Id { get; set; }
    public Guid TripId { get; set; }
    public Guid DriverId { get; set; }
    public Guid ReporterId { get; set; }
    public TripReportType Type { get; set; }
    public TripReportStatus Status { get; set; } = TripReportStatus.Open;
    public string Description { get; set; } = string.Empty;
    public string? AdminNotes { get; set; }
    public DateTime? ResolvedAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public void Verify(string? adminNotes = null)
    {
        Status = TripReportStatus.Verified;
        AdminNotes = adminNotes;
        UpdatedAt = DateTime.UtcNow;
    }

    public void Dismiss(string? adminNotes = null)
    {
        Status = TripReportStatus.Dismissed;
        AdminNotes = adminNotes;
        ResolvedAt = DateTime.UtcNow;
        UpdatedAt = DateTime.UtcNow;
    }

    public void TakeAction(string? adminNotes = null)
    {
        Status = TripReportStatus.ActionTaken;
        AdminNotes = adminNotes;
        ResolvedAt = DateTime.UtcNow;
        UpdatedAt = DateTime.UtcNow;
    }
}
