namespace JalemosBackend.Modules.TripReports.Application.DTOs;

public sealed class UpdateTripReportStatusDto
{
    /// <summary>"verified" | "dismissed" | "action_taken"</summary>
    public string Status { get; set; } = string.Empty;
    public string? AdminNotes { get; set; }
}
