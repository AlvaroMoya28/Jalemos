using JalemosBackend.Modules.Trips.Application.DTOs;

namespace JalemosBackend.Modules.Trips.Application;

public interface ITripLifecycleService
{
    Task<TripStatusDto> StartBoardingAsync(Guid tripId, Guid callerId, CancellationToken ct = default);
    Task<QrScanResultDto> ScanQrAsync(Guid tripId, string qrToken, Guid callerId, CancellationToken ct = default);
    Task<TripStatusDto> StartJourneyAsync(Guid tripId, Guid callerId, CancellationToken ct = default);
    Task<TripStatusDto> CompleteTripAsync(Guid tripId, Guid callerId, CancellationToken ct = default);
    Task CancelTripAsync(Guid tripId, string reason, string? details, Guid callerId, bool isAdmin, CancellationToken ct = default);
    Task MarkNoShowAsync(Guid bookingId, Guid callerId, CancellationToken ct = default);
    Task<TripStatusDto> GetTripStatusAsync(Guid tripId, Guid callerId, CancellationToken ct = default);
    Task<TripStatusDto?> GetActiveDriverTripAsync(Guid driverId, CancellationToken ct = default);
    Task<ActivePassengerTripDto?> GetActivePassengerTripAsync(Guid passengerId, CancellationToken ct = default);
}
