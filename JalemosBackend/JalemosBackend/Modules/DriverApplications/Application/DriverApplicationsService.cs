using JalemosBackend.Infrastructure.Persistence;
using JalemosBackend.Modules.DriverApplications.Application.DTOs;
using JalemosBackend.Modules.DriverApplications.Infrastructure;

namespace JalemosBackend.Modules.DriverApplications.Application;

public sealed class DriverApplicationsService : IDriverApplicationsService
{
    private readonly DriverApplicationsRepository _repo;

    public DriverApplicationsService(DriverApplicationsRepository repo) => _repo = repo;

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
        var entity = new DriverApplicationEntity
        {
            ApplicationId    = Guid.NewGuid(),
            UserId           = userId,
            Status           = ApplicationStatus.pending,
            Attempts         = 1,
            Cedula           = dto.Cedula.Trim(),
            Address          = dto.Address.Trim(),
            VehicleBrand     = dto.VehicleBrand.Trim(),
            VehicleModel     = dto.VehicleModel.Trim(),
            VehicleYear      = dto.VehicleYear,
            VehiclePlate     = dto.VehiclePlate.Trim().ToUpper(),
            VehicleColor     = dto.VehicleColor.Trim(),
            LicensePhotoFront = dto.LicensePhotoFront,
            LicensePhotoBack  = dto.LicensePhotoBack,
            DekraPhoto        = dto.DekraPhoto,
            SubmittedAt      = DateTime.UtcNow,
            UpdatedAt        = DateTime.UtcNow,
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

        // Reuse existing entity fields but update mutable ones — EF Update needs a tracked copy
        var tracked = new DriverApplicationEntity
        {
            ApplicationId     = entity.ApplicationId,
            UserId            = entity.UserId,
            Status            = ApplicationStatus.pending,
            Attempts          = (short)(entity.Attempts + 1),
            Cedula            = dto.Cedula.Trim(),
            Address           = dto.Address.Trim(),
            VehicleBrand      = dto.VehicleBrand.Trim(),
            VehicleModel      = dto.VehicleModel.Trim(),
            VehicleYear       = dto.VehicleYear,
            VehiclePlate      = dto.VehiclePlate.Trim().ToUpper(),
            VehicleColor      = dto.VehicleColor.Trim(),
            LicensePhotoFront = dto.LicensePhotoFront,
            LicensePhotoBack  = dto.LicensePhotoBack,
            DekraPhoto        = dto.DekraPhoto,
            AdminIssueIds     = null,
            AdminNotes        = null,
            ReviewedAt        = null,
            SubmittedAt       = entity.SubmittedAt,
            UpdatedAt         = DateTime.UtcNow,
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

    public async Task ApproveAsync(Guid applicationId, CancellationToken ct = default)
    {
        var entity = await GetTrackedOrThrowAsync(applicationId, ct);
        entity.Status     = ApplicationStatus.approved;
        entity.ReviewedAt = DateTime.UtcNow;
        entity.UpdatedAt  = DateTime.UtcNow;
        await _repo.UpdateAsync(entity, ct);
        await _repo.PromoteToDriverAsync(entity.UserId, ct);
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

        return new ApplicationResponse(
            ApplicationId:    e.ApplicationId,
            UserId:           e.UserId,
            Status:           e.Status.ToString(),
            Attempts:         e.Attempts,
            Cedula:           e.Cedula,
            Address:          e.Address,
            VehicleBrand:     e.VehicleBrand,
            VehicleModel:     e.VehicleModel,
            VehicleYear:      e.VehicleYear,
            VehiclePlate:     e.VehiclePlate,
            VehicleColor:     e.VehicleColor,
            LicensePhotoFront: e.LicensePhotoFront,
            LicensePhotoBack:  e.LicensePhotoBack,
            DekraPhoto:        e.DekraPhoto,
            AdminIssueIds:     e.AdminIssueIds,
            AdminNotes:        e.AdminNotes,
            ReviewedAt:        e.ReviewedAt?.ToString("O"),
            SubmittedAt:       e.SubmittedAt.ToString("O"),
            UpdatedAt:         e.UpdatedAt.ToString("O"),
            ApplicantName:     name,
            ApplicantEmail:    email,
            ApplicantAvatar:   avatar
        );
    }
}
