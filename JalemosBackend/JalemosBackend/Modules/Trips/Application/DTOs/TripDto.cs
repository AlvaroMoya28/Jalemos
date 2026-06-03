namespace JalemosBackend.Modules.Trips.Application.DTOs;

/// <summary>
/// Trip response enriched with embedded driver info to avoid N+1 calls from clients.
/// </summary>
public sealed class TripDto
{
    public Guid   Id                  { get; set; }
    public Guid   DriverId            { get; set; }
    public string DriverFirstName     { get; set; } = string.Empty;
    public string DriverLastName      { get; set; } = string.Empty;
    public decimal DriverMeanRating   { get; set; }
    public int    DriverTotalTrips    { get; set; }
    public DateTime DriverCreatedAt   { get; set; }
    public Guid   VehicleId           { get; set; }
    public decimal Rate               { get; set; }
    public string Origin              { get; set; } = string.Empty;
    public string Destination         { get; set; } = string.Empty;
    public decimal OriginLatitude     { get; set; }
    public decimal OriginLongitude    { get; set; }
    public decimal DestinationLatitude  { get; set; }
    public decimal DestinationLongitude { get; set; }
    public DateTime DepartureAt       { get; set; }
    public short  TotalSeats          { get; set; }
    public short  AvailableSeats      { get; set; }
    public string Notes               { get; set; } = string.Empty;
    public string State               { get; set; } = string.Empty;
    public DateTime CreatedAt         { get; set; }
}
