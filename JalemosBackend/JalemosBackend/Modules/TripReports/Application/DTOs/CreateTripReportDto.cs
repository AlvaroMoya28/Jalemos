namespace JalemosBackend.Modules.TripReports.Application.DTOs;

public sealed class CreateTripReportDto
{
    public Guid TripId { get; set; }
    /// <summary>"emergency" or "driver_report"</summary>
    public string Type { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
}
