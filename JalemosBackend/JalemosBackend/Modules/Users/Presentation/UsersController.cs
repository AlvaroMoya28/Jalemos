// Admin user management endpoints.
// All routes require an authenticated admin JWT.

using JalemosBackend.Modules.Users.Application;
using JalemosBackend.Modules.Users.Application.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace JalemosBackend.Modules.Users.Presentation;

[ApiController]
[Route("api/users")]
[Authorize(Roles = "admin")]
public sealed class UsersController : ControllerBase
{
    private readonly IUsersService _usersService;

    public UsersController(IUsersService usersService) => _usersService = usersService;

    // GET /api/users?search=&role=&status=&sortBy=name_asc&page=1&pageSize=30
    [HttpGet]
    public async Task<IActionResult> GetPaged([FromQuery] UserQueryParams query, CancellationToken ct)
    {
        try
        {
            var result = await _usersService.GetPagedAsync(query, ct);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return Problem(detail: ex.Message, statusCode: 500);
        }
    }

    // GET /api/users/{id}
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
    {
        var user = await _usersService.GetByIdAsync(id, ct);
        if (user is null) return NotFound();

        var dto = new UserSummaryDto
        {
            Id             = user.Id,
            Username       = user.Username,
            Email          = user.Email,
            FirstName      = user.FirstName,
            LastName       = user.LastName,
            Role           = user.Role.ToString(),
            MeanRating     = user.MeanRating,
            TotalTrips     = user.TotalTrips,
            Kms            = user.Kms,
            IsActive       = user.IsActive,
            SuspendedUntil = user.SuspendedUntil,
            CreatedAt      = user.CreatedAt,
        };
        return Ok(dto);
    }

    // PATCH /api/users/{id}/role  — body: { "role": "passenger" }
    [HttpPatch("{id:guid}/role")]
    public async Task<IActionResult> ChangeRole(Guid id, [FromBody] ChangeRoleRequest dto, CancellationToken ct)
    {
        try
        {
            await _usersService.ChangeRoleAsync(id, dto.Role, ct);
            return NoContent();
        }
        catch (KeyNotFoundException)       { return NotFound(); }
        catch (ArgumentException ex)       { return Problem(detail: ex.Message, statusCode: 400); }
    }

    // PATCH /api/users/{id}/ban  — body: { "days": 7 }  (0 = permanent)
    [HttpPatch("{id:guid}/ban")]
    public async Task<IActionResult> Ban(Guid id, [FromBody] BanUserRequest dto, CancellationToken ct)
    {
        try
        {
            await _usersService.BanAsync(id, dto.Days, ct);
            return NoContent();
        }
        catch (KeyNotFoundException)  { return NotFound(); }
        catch (ArgumentException ex)  { return Problem(detail: ex.Message, statusCode: 400); }
    }

    // PATCH /api/users/{id}/lift-ban
    [HttpPatch("{id:guid}/lift-ban")]
    public async Task<IActionResult> LiftBan(Guid id, CancellationToken ct)
    {
        try   { await _usersService.LiftBanAsync(id, ct); return NoContent(); }
        catch (KeyNotFoundException) { return NotFound(); }
    }

    // PATCH /api/users/{id}/deactivate
    [HttpPatch("{id:guid}/deactivate")]
    public async Task<IActionResult> Deactivate(Guid id, CancellationToken ct)
    {
        try   { await _usersService.DeactivateAsync(id, ct); return NoContent(); }
        catch (KeyNotFoundException) { return NotFound(); }
    }

    // PATCH /api/users/{id}/activate
    [HttpPatch("{id:guid}/activate")]
    public async Task<IActionResult> Activate(Guid id, CancellationToken ct)
    {
        try   { await _usersService.ActivateAsync(id, ct); return NoContent(); }
        catch (KeyNotFoundException) { return NotFound(); }
    }
}
