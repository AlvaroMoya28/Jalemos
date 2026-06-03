using JalemosBackend.Infrastructure.Persistence;
using JalemosBackend.Modules.DriverApplications.Application.DTOs;
using JalemosBackend.Modules.DriverApplications.Infrastructure;
using JalemosBackend.Modules.Storage;

namespace JalemosBackend.Modules.DriverApplications.Application;

public sealed class DriverApplicationsService : IDriverApplicationsService
{
    private readonly DriverApplicationsRepository _repo;
    private readonly IStorageService              _storage;

    public DriverApplicationsService(DriverApplicationsRepository repo, IStorageService storage)
    {
        _repo    = repo;
        _storage = storage;
    }

    public async Task<ApplicationResponse?> GetMyApplicationAsync(Guid userId, CancellationToken ct = default)
    {
        var entity = await _repo.GetLatestByUserAsync(userId, ct);
        if (entity is null) return null;
        return await ToResponseAsync(entity, ct);
    }

    public async Task<IEnumerable<ApplicationResponse>> GetAllAsync(string? statusFilter, CancellationToken ct = default)
    {
        ApplicationStatus? status = null;
        if (!string.IsNullOrWhiteSpace(statusFilter) && Enum.TryParse<ApplicationStatus>(statusFilter, out var parsed))
            status = parsed;

        var list = await _repo.GetAllAsync(status, ct);
        var responses = new List<ApplicationResponse>(list.Count);
        foreach (var e in list)
            responses.Add(await ToResponseAsync(e, ct));
        return responses;
    }

    public async Task<ApplicationResponse?> GetByIdAsync(Guid applicationId, CancellationToken ct = default)
    {
        var entity = await _repo.GetByIdAsync(applicationId, ct);
        if (entity is null) return null;
        return await ToResponseAsync(entity, ct);
    }

    public async Task<ApplicationResponse> SubmitAsync(Guid userId, SubmitApplicationRequest dto, CancellationToken ct = default)
    {
        string cedula, address, vehicleBrand, vehicleModel, vehiclePlate, vehicleColor;
        short vehicleYear;

        if (dto.IsRenewal)
        {
            // Renewals only update documents — copy vehicle/personal data from the existing approved application
            var existing = await _repo.GetLatestByUserAsync(userId, ct)
                ?? throw new InvalidOperationException("No se encontró una solicitud aprobada para renovar.");
            cedula       = existing.Cedula;
            address      = existing.Address;
            vehicleBrand = existing.VehicleBrand;
            vehicleModel = existing.VehicleModel;
            vehicleYear  = existing.VehicleYear;
            vehiclePlate = existing.VehiclePlate;
            vehicleColor = existing.VehicleColor;
        }
        else
        {
            // Cooldown: 3 días después de un rechazo
            var latest = await _repo.GetLatestByUserAsync(userId, ct);
            if (latest?.Status == ApplicationStatus.rejected && latest.ReviewedAt.HasValue)
            {
                var cooldownEnd = latest.ReviewedAt.Value.AddDays(3);
                if (cooldownEnd > DateTime.UtcNow)
                    throw new CooldownException(cooldownEnd);
            }

            if (string.IsNullOrWhiteSpace(dto.Cedula))       throw new InvalidOperationException("La cédula es requerida.");
            if (string.IsNullOrWhiteSpace(dto.Address))      throw new InvalidOperationException("La dirección es requerida.");
            if (string.IsNullOrWhiteSpace(dto.VehicleBrand)) throw new InvalidOperationException("La marca del vehículo es requerida.");
            if (string.IsNullOrWhiteSpace(dto.VehicleModel)) throw new InvalidOperationException("El modelo del vehículo es requerido.");
            if (dto.VehicleYear is null)                     throw new InvalidOperationException("El año del vehículo es requerido.");
            if (string.IsNullOrWhiteSpace(dto.VehiclePlate)) throw new InvalidOperationException("La placa es requerida.");
            if (string.IsNullOrWhiteSpace(dto.VehicleColor)) throw new InvalidOperationException("El color del vehículo es requerido.");
            cedula       = dto.Cedula.Trim();
            address      = dto.Address.Trim();
            vehicleBrand = dto.VehicleBrand.Trim();
            vehicleModel = dto.VehicleModel.Trim();
            vehicleYear  = dto.VehicleYear.Value;
            vehiclePlate = dto.VehiclePlate.Trim().ToUpper();
            vehicleColor = dto.VehicleColor.Trim();
        }

        var faceUrl  = await _storage.UploadBase64Async(dto.FacePhoto,         "user-profiles",               ct);
        var frontUrl = await _storage.UploadBase64Async(dto.LicensePhotoFront, "driver-applications/licenses", ct);
        var backUrl  = await _storage.UploadBase64Async(dto.LicensePhotoBack,  "driver-applications/licenses", ct);
        var dekraUrl = await _storage.UploadBase64Async(dto.DekraPhoto,        "driver-applications/dekra",    ct);

        var entity = new DriverApplicationEntity
        {
            ApplicationId     = Guid.NewGuid(),
            UserId            = userId,
            Status            = ApplicationStatus.pending,
            Attempts          = 1,
            Cedula            = cedula,
            Address           = address,
            VehicleBrand      = vehicleBrand,
            VehicleModel      = vehicleModel,
            VehicleYear       = vehicleYear,
            VehiclePlate      = vehiclePlate,
            VehicleColor      = vehicleColor,
            FacePhoto         = faceUrl,
            LicensePhotoFront = frontUrl,
            LicensePhotoBack  = backUrl,
            DekraPhoto        = dekraUrl,
            LicenseExpiryMonth = dto.LicenseExpiryMonth,
            LicenseExpiryYear  = dto.LicenseExpiryYear,
            DekraExpiryMonth   = dto.DekraExpiryMonth,
            DekraExpiryYear    = dto.DekraExpiryYear,
            IsRenewal         = dto.IsRenewal,
            SubmittedAt       = DateTime.UtcNow,
            UpdatedAt         = DateTime.UtcNow,
        };

        await _repo.CreateAsync(entity, ct);
        return await ToResponseAsync(entity, ct);
    }

    public async Task<ApplicationResponse> ResubmitAsync(Guid applicationId, Guid userId, SubmitApplicationRequest dto, CancellationToken ct = default)
    {
        var entity = await _repo.GetByIdAsync(applicationId, ct)
            ?? throw new InvalidOperationException("Solicitud no encontrada.");

        if (entity.UserId != userId)
            throw new UnauthorizedAccessException("No tenés permiso para modificar esta solicitud.");

        if (entity.Status != ApplicationStatus.needs_correction)
            throw new InvalidOperationException("Solo se puede reenviar una solicitud en estado 'needs_correction'.");

        var faceUrl  = await _storage.UploadBase64Async(dto.FacePhoto,         "user-profiles",               ct);
        var frontUrl = await _storage.UploadBase64Async(dto.LicensePhotoFront, "driver-applications/licenses", ct);
        var backUrl  = await _storage.UploadBase64Async(dto.LicensePhotoBack,  "driver-applications/licenses", ct);
        var dekraUrl = await _storage.UploadBase64Async(dto.DekraPhoto,        "driver-applications/dekra",    ct);

        var tracked = new DriverApplicationEntity
        {
            ApplicationId      = entity.ApplicationId,
            UserId             = entity.UserId,
            Status             = ApplicationStatus.pending,
            Attempts           = (short)(entity.Attempts + 1),
            Cedula             = dto.Cedula?.Trim()       ?? entity.Cedula,
            Address            = dto.Address?.Trim()      ?? entity.Address,
            VehicleBrand       = dto.VehicleBrand?.Trim() ?? entity.VehicleBrand,
            VehicleModel       = dto.VehicleModel?.Trim() ?? entity.VehicleModel,
            VehicleYear        = dto.VehicleYear          ?? entity.VehicleYear,
            VehiclePlate       = dto.VehiclePlate?.Trim().ToUpper() ?? entity.VehiclePlate,
            VehicleColor       = dto.VehicleColor?.Trim() ?? entity.VehicleColor,
            FacePhoto          = faceUrl  ?? entity.FacePhoto,
            LicensePhotoFront  = frontUrl ?? entity.LicensePhotoFront,
            LicensePhotoBack   = backUrl  ?? entity.LicensePhotoBack,
            DekraPhoto         = dekraUrl ?? entity.DekraPhoto,
            LicenseExpiryMonth = dto.LicenseExpiryMonth ?? entity.LicenseExpiryMonth,
            LicenseExpiryYear  = dto.LicenseExpiryYear  ?? entity.LicenseExpiryYear,
            DekraExpiryMonth   = dto.DekraExpiryMonth   ?? entity.DekraExpiryMonth,
            DekraExpiryYear    = dto.DekraExpiryYear    ?? entity.DekraExpiryYear,
            IsRenewal          = entity.IsRenewal,
            AdminIssueIds      = null,
            AdminNotes         = null,
            ReviewedAt         = null,
            SubmittedAt        = entity.SubmittedAt,
            UpdatedAt          = DateTime.UtcNow,
        };

        await _repo.UpdateAsync(tracked, ct);
        return await ToResponseAsync(tracked, ct);
    }

    public async Task SetUnderReviewAsync(Guid applicationId, CancellationToken ct = default)
    {
        var entity = await GetTrackedOrThrowAsync(applicationId, ct);
        entity.Status    = ApplicationStatus.under_review;
        entity.UpdatedAt = DateTime.UtcNow;
        await _repo.UpdateAsync(entity, ct);
    }

    public async Task RequestCorrectionAsync(Guid applicationId, ReviewActionRequest dto, CancellationToken ct = default)
    {
        var entity = await GetTrackedOrThrowAsync(applicationId, ct);
        entity.Status        = ApplicationStatus.needs_correction;
        entity.AdminIssueIds = dto.IssueIds;
        entity.AdminNotes    = dto.Notes;
        entity.ReviewedAt    = DateTime.UtcNow;
        entity.UpdatedAt     = DateTime.UtcNow;
        await _repo.UpdateAsync(entity, ct);
    }

    public async Task<IEnumerable<ApplicationResponse>> GetMyVehicleApplicationsAsync(Guid userId, CancellationToken ct = default)
    {
        var list = await _repo.GetMyVehicleApplicationsAsync(userId, ct);
        var responses = new List<ApplicationResponse>(list.Count);
        foreach (var e in list)
            responses.Add(await ToResponseAsync(e, ct));
        return responses;
    }

    public async Task<ApplicationResponse> SubmitVehicleApplicationAsync(Guid userId, SubmitVehicleApplicationRequest dto, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(dto.VehicleBrand)) throw new InvalidOperationException("La marca del vehículo es requerida.");
        if (string.IsNullOrWhiteSpace(dto.VehicleModel)) throw new InvalidOperationException("El modelo del vehículo es requerido.");
        if (dto.VehicleYear is null)                     throw new InvalidOperationException("El año del vehículo es requerido.");
        if (string.IsNullOrWhiteSpace(dto.VehiclePlate)) throw new InvalidOperationException("La placa es requerida.");
        if (string.IsNullOrWhiteSpace(dto.VehicleColor)) throw new InvalidOperationException("El color del vehículo es requerido.");

        var entity = new DriverApplicationEntity
        {
            ApplicationId   = Guid.NewGuid(),
            UserId          = userId,
            Status          = ApplicationStatus.pending,
            Attempts        = 1,
            ApplicationType = "vehicle",
            Cedula          = string.Empty,
            Address         = string.Empty,
            VehicleBrand    = dto.VehicleBrand.Trim(),
            VehicleModel    = dto.VehicleModel.Trim(),
            VehicleYear     = dto.VehicleYear.Value,
            VehiclePlate    = dto.VehiclePlate.Trim().ToUpper(),
            VehicleColor    = dto.VehicleColor.Trim(),
            IsRenewal       = false,
            SubmittedAt     = DateTime.UtcNow,
            UpdatedAt       = DateTime.UtcNow,
        };

        await _repo.CreateAsync(entity, ct);
        return await ToResponseAsync(entity, ct);
    }

    public async Task ApproveAsync(Guid applicationId, CancellationToken ct = default)
    {
        var entity = await GetTrackedOrThrowAsync(applicationId, ct);
        entity.Status     = ApplicationStatus.approved;
        entity.ReviewedAt = DateTime.UtcNow;
        entity.UpdatedAt  = DateTime.UtcNow;
        await _repo.UpdateAsync(entity, ct);

        if (entity.ApplicationType == "vehicle")
        {
            // Agrega el vehículo directamente — el usuario ya es conductor
            await _repo.CreateVehicleForUserAsync(
                entity.UserId,
                entity.VehicleBrand, entity.VehicleModel,
                entity.VehicleYear,  entity.VehiclePlate, entity.VehicleColor,
                ct);
        }
        else if (entity.IsRenewal)
        {
            // Solo actualiza documentos y fechas de vencimiento
            await _repo.UpdateDocumentsAsync(
                entity.UserId,
                entity.LicensePhotoFront, entity.LicensePhotoBack, entity.DekraPhoto,
                entity.LicenseExpiryMonth, entity.LicenseExpiryYear,
                entity.DekraExpiryMonth,   entity.DekraExpiryYear,
                ct);
        }
        else
        {
            await _repo.PromoteToDriverAsync(
                entity.UserId, entity.FacePhoto,
                entity.LicenseExpiryMonth, entity.LicenseExpiryYear,
                entity.DekraExpiryMonth,   entity.DekraExpiryYear,
                ct);
        }
    }

    public async Task RejectAsync(Guid applicationId, ReviewActionRequest dto, CancellationToken ct = default)
    {
        var entity = await GetTrackedOrThrowAsync(applicationId, ct);
        entity.Status        = ApplicationStatus.rejected;
        entity.AdminIssueIds = dto.IssueIds;
        entity.AdminNotes    = dto.Notes;
        entity.ReviewedAt    = DateTime.UtcNow;
        entity.UpdatedAt     = DateTime.UtcNow;
        await _repo.UpdateAsync(entity, ct);
    }

    public async Task LiftCooldownAsync(Guid applicationId, CancellationToken ct = default)
    {
        var entity = await GetTrackedOrThrowAsync(applicationId, ct);
        if (entity.Status != ApplicationStatus.rejected)
            throw new InvalidOperationException("Solo se puede levantar el cooldown de solicitudes rechazadas.");
        entity.ReviewedAt = null;
        entity.UpdatedAt  = DateTime.UtcNow;
        await _repo.UpdateAsync(entity, ct);
    }

    // Helpers

    private async Task<DriverApplicationEntity> GetTrackedOrThrowAsync(Guid id, CancellationToken ct)
    {
        var entity = await _repo.GetByIdAsync(id, ct)
            ?? throw new InvalidOperationException("Solicitud no encontrada.");
        return entity;
    }

    private async Task<ApplicationResponse> ToResponseAsync(DriverApplicationEntity e, CancellationToken ct)
    {
        var info = await _repo.GetApplicantInfoAsync(e.UserId, ct);
        var name   = info?.FullName;
        var email  = info?.Email;
        var avatar = name is { Length: > 0 }
            ? string.Concat(name.Split(' ').Where(p => p.Length > 0).Take(2).Select(p => p[0].ToString())).ToUpper()
            : "?";

        string? cooldownUntil = null;
        if (e.Status == ApplicationStatus.rejected && e.ReviewedAt.HasValue)
        {
            var expires = e.ReviewedAt.Value.AddDays(3);
            if (expires > DateTime.UtcNow)
                cooldownUntil = expires.ToString("O");
        }

        return new ApplicationResponse(
            ApplicationId:      e.ApplicationId,
            UserId:             e.UserId,
            Status:             e.Status.ToString(),
            ApplicationType:    e.ApplicationType,
            Attempts:           e.Attempts,
            Cedula:             e.Cedula,
            Address:            e.Address,
            VehicleBrand:       e.VehicleBrand,
            VehicleModel:       e.VehicleModel,
            VehicleYear:        e.VehicleYear,
            VehiclePlate:       e.VehiclePlate,
            VehicleColor:       e.VehicleColor,
            FacePhoto:          e.FacePhoto,
            LicensePhotoFront:  e.LicensePhotoFront,
            LicensePhotoBack:   e.LicensePhotoBack,
            DekraPhoto:         e.DekraPhoto,
            LicenseExpiryMonth: e.LicenseExpiryMonth,
            LicenseExpiryYear:  e.LicenseExpiryYear,
            DekraExpiryMonth:   e.DekraExpiryMonth,
            DekraExpiryYear:    e.DekraExpiryYear,
            IsRenewal:          e.IsRenewal,
            AdminIssueIds:      e.AdminIssueIds,
            AdminNotes:         e.AdminNotes,
            ReviewedAt:         e.ReviewedAt?.ToString("O"),
            SubmittedAt:        e.SubmittedAt.ToString("O"),
            UpdatedAt:          e.UpdatedAt.ToString("O"),
            ApplicantName:      name,
            ApplicantEmail:     email,
            ApplicantAvatar:    avatar,
            CooldownUntil:      cooldownUntil
        );
    }
}
