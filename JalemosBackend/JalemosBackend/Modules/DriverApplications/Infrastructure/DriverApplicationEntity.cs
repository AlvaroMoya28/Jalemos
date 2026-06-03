using JalemosBackend.Infrastructure.Persistence;

namespace JalemosBackend.Modules.DriverApplications.Infrastructure;

public class DriverApplicationEntity
{
    public Guid ApplicationId { get; set; }
    public Guid UserId { get; set; }
    public ApplicationStatus Status { get; set; }
    public short Attempts { get; set; }
    public string Cedula { get; set; } = null!;
    public string Address { get; set; } = null!;
    public string VehicleBrand { get; set; } = null!;
    public string VehicleModel { get; set; } = null!;
    public short VehicleYear { get; set; }
    public string VehiclePlate { get; set; } = null!;
    public string VehicleColor { get; set; } = null!;
    public string? FacePhoto { get; set; }
    public string? LicensePhotoFront { get; set; }
    public string? LicensePhotoBack { get; set; }
    public string? DekraPhoto { get; set; }
    public short? LicenseExpiryMonth { get; set; }
    public short? LicenseExpiryYear { get; set; }
    public short? DekraExpiryMonth { get; set; }
    public short? DekraExpiryYear { get; set; }
    public string ApplicationType { get; set; } = "driver";
    public bool IsRenewal { get; set; }
    public string[]? AdminIssueIds { get; set; }
    public string? AdminNotes { get; set; }
    public DateTime? ReviewedAt { get; set; }
    public DateTime SubmittedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
