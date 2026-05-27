namespace JalemosBackend.Modules.DriverApplications.Application.DTOs;

public sealed record SubmitApplicationRequest(
    string? Cedula,
    string? Address,
    string? VehicleBrand,
    string? VehicleModel,
    short?  VehicleYear,
    string? VehiclePlate,
    string? VehicleColor,
    string? FacePhoto,
    string? LicensePhotoFront,
    string? LicensePhotoBack,
    string? DekraPhoto,
    short?  LicenseExpiryMonth,
    short?  LicenseExpiryYear,
    short?  DekraExpiryMonth,
    short?  DekraExpiryYear,
    bool    IsRenewal = false
);
