namespace JalemosBackend.Modules.DriverApplications.Application.DTOs;

public sealed record SubmitVehicleApplicationRequest(
    string? VehicleBrand,
    string? VehicleModel,
    short?  VehicleYear,
    string? VehiclePlate,
    string? VehicleColor
);
