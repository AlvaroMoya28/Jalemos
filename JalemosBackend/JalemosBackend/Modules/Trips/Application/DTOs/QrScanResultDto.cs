namespace JalemosBackend.Modules.Trips.Application.DTOs;

public sealed class QrScanResultDto
{
    public Guid BookingId { get; set; }
    public Guid PassengerId { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public short SeatsReserved { get; set; }
    public bool AlreadyBoarded { get; set; }
}
