namespace JalemosBackend.Modules.TripReports.Application.DTOs;

public sealed class TripReportDto
{
    public Guid Id { get; init; }
    public Guid TripId { get; init; }
    public Guid DriverId { get; init; }
    public Guid ReporterId { get; init; }
    public string Type { get; init; } = string.Empty;
    public string Status { get; init; } = string.Empty;
    public string Description { get; init; } = string.Empty;
    public string? AdminNotes { get; init; }
    public DateTime? ResolvedAt { get; init; }
    public DateTime CreatedAt { get; init; }
    public DateTime UpdatedAt { get; init; }
}
