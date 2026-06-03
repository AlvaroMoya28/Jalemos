namespace JalemosBackend.Modules.Trips.Application.DTOs;

public sealed class CancelTripDto
{
    /// <summary>Short reason code: vehicle_issue, personal_emergency, traffic_problem, route_change, other</summary>
    public string Reason { get; set; } = "other";
    public string? Details { get; set; }
}
