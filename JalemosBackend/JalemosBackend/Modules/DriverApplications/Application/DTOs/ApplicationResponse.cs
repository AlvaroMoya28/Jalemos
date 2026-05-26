namespace JalemosBackend.Modules.DriverApplications.Application.DTOs;

public sealed record ApplicationResponse(
    Guid    ApplicationId,
    Guid    UserId,
    string  Status,
    int     Attempts,
    string  Cedula,
    string  Address,
    string  VehicleBrand,
    string  VehicleModel,
    short   VehicleYear,
    string  VehiclePlate,
    string  VehicleColor,
    string? LicensePhotoFront,
    string? LicensePhotoBack,
    string? DekraPhoto,
    string[]? AdminIssueIds,
    string? AdminNotes,
    string? ReviewedAt,
    string  SubmittedAt,
    string  UpdatedAt,
    string? ApplicantName,
    string? ApplicantEmail,
    string? ApplicantAvatar
);
