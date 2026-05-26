namespace JalemosBackend.Modules.DriverApplications.Application.DTOs;

public sealed record SubmitApplicationRequest(
    string Cedula,
    string Address,
    string VehicleBrand,
    string VehicleModel,
    short  VehicleYear,
    string VehiclePlate,
    string VehicleColor,
    string? LicensePhotoFront,
    string? LicensePhotoBack,
    string? DekraPhoto
);
