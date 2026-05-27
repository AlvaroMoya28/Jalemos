// Application service for the Users module.
// Enforces user-related business rules and delegates data persistence to UsersRepository.

using JalemosBackend.Modules.Users.Application.DTOs;
using JalemosBackend.Modules.Users.Domain;
using JalemosBackend.Modules.Users.Infrastructure;

namespace JalemosBackend.Modules.Users.Application;

public sealed class UsersService : IUsersService
{
    private readonly UsersRepository _repository;

    public UsersService(UsersRepository repository)
    {
        _repository = repository;
    }

    public Task<IEnumerable<User>> GetAllAsync(CancellationToken cancellationToken = default) =>
        _repository.GetAllAsync(cancellationToken);

    public Task<User?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default) =>
        _repository.GetByIdAsync(id, cancellationToken);

    public async Task<PagedUsersResponse> GetPagedAsync(UserQueryParams queryParams, CancellationToken cancellationToken = default)
    {
        var page     = Math.Max(1, queryParams.Page);
        var pageSize = Math.Clamp(queryParams.PageSize, 1, 100);

        var (users, total) = await _repository.GetPagedAsync(queryParams, cancellationToken);

        var now = DateTime.UtcNow;
        var dtos = users.Select(u => new UserSummaryDto
        {
            Id             = u.Id,
            Username       = u.Username,
            Email          = u.Email,
            FirstName      = u.FirstName,
            LastName       = u.LastName,
            Role           = u.Role.ToString(),
            MeanRating     = u.MeanRating,
            TotalTrips     = u.TotalTrips,
            Kms            = u.Kms,
            IsActive       = u.IsActive,
            SuspendedUntil = u.SuspendedUntil,
            CreatedAt      = u.CreatedAt,
        });

        return new PagedUsersResponse
        {
            Users      = dtos,
            TotalCount = total,
            Page       = page,
            PageSize   = pageSize,
            TotalPages = (int)Math.Ceiling(total / (double)pageSize),
        };
    }

    public Task CreateAsync(User user, CancellationToken cancellationToken = default) =>
        _repository.CreateAsync(user, cancellationToken);

    public Task UpdateAsync(User user, CancellationToken cancellationToken = default) =>
        _repository.UpdateAsync(user, cancellationToken);

    public Task DeleteAsync(Guid id, CancellationToken cancellationToken = default) =>
        _repository.DeleteAsync(id, cancellationToken);

    public Task ChangeRoleAsync(Guid id, string role, CancellationToken cancellationToken = default)
    {
        if (!Enum.TryParse<UserRole>(role, ignoreCase: true, out var roleEnum))
            throw new ArgumentException($"Role '{role}' is not valid. Use admin, passenger, or driver.");
        return _repository.UpdateRoleAsync(id, roleEnum, cancellationToken);
    }

    public Task BanAsync(Guid id, int days, CancellationToken cancellationToken = default)
    {
        if (days < 0) throw new ArgumentException("Days must be >= 0 (0 = permanent).");
        return _repository.BanAsync(id, days, cancellationToken);
    }

    public Task LiftBanAsync(Guid id, CancellationToken cancellationToken = default) =>
        _repository.LiftBanAsync(id, cancellationToken);

    public Task DeactivateAsync(Guid id, CancellationToken cancellationToken = default) =>
        _repository.DeactivateAsync(id, cancellationToken);

    public Task ActivateAsync(Guid id, CancellationToken cancellationToken = default) =>
        _repository.ActivateAsync(id, cancellationToken);
}
