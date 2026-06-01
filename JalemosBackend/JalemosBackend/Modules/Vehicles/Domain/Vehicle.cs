using JalemosBackend.Infrastructure.Persistence;
namespace JalemosBackend.Modules.Vehicles.Domain;

public sealed class Vehicle
{
    public Guid VehicleId { get; set; }
    public Guid UserId { get; set; }
    public string Brand { get; set; } = string.Empty;
    public string Model { get; set; } = string.Empty;
    public short Year { get; set; }
    public string NumPlate { get; set; } = string.Empty;
    public string Color { get; set; } = string.Empty;
    public bool Active { get; set; }
    public DateTime CreatedAt { get; set; }
}
