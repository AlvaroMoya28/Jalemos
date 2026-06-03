namespace JalemosBackend.Modules.Vehicles.Infrastructure;

public class VehicleEntity
{
    public Guid VehicleId { get; set; }
    public Guid UserId { get; set; }
    public string Brand { get; set; } = null!;
    public string Model { get; set; } = null!;
    public short Year { get; set; }
    public string NumPlate { get; set; } = null!;
    public string Color { get; set; } = null!;
    public bool Active { get; set; }
    public DateTime CreatedAt { get; set; }
}
