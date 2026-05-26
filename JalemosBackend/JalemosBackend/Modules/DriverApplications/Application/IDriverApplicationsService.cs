using JalemosBackend.Modules.DriverApplications.Application.DTOs;

namespace JalemosBackend.Modules.DriverApplications.Application;

public interface IDriverApplicationsService
{
    Task<ApplicationResponse?>              GetMyApplicationAsync(Guid userId, CancellationToken ct = default);
    Task<IEnumerable<ApplicationResponse>>  GetAllAsync(string? statusFilter, CancellationToken ct = default);
    Task<ApplicationResponse?>              GetByIdAsync(Guid applicationId, CancellationToken ct = default);
    Task<ApplicationResponse>               SubmitAsync(Guid userId, SubmitApplicationRequest dto, CancellationToken ct = default);
    Task<ApplicationResponse>               ResubmitAsync(Guid applicationId, Guid userId, SubmitApplicationRequest dto, CancellationToken ct = default);
    Task                                    SetUnderReviewAsync(Guid applicationId, CancellationToken ct = default);
    Task                                    RequestCorrectionAsync(Guid applicationId, ReviewActionRequest dto, CancellationToken ct = default);
    Task                                    ApproveAsync(Guid applicationId, CancellationToken ct = default);
    Task                                    RejectAsync(Guid applicationId, ReviewActionRequest dto, CancellationToken ct = default);
}
