// Admin user management endpoints.
// All routes require an authenticated admin JWT.

using JalemosBackend.Modules.Users.Application;
using JalemosBackend.Modules.Users.Application.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace JalemosBackend.Modules.Users.Presentation;

[ApiController]
[Route("api/users")]
public sealed class UsersController : ControllerBase
{
    private readonly IUsersService _usersService;

    public UsersController(IUsersService usersService) => _usersService = usersService;

    /// <summary>GET /api/users/me — returns the authenticated user's profile including their QR token.</summary>
    [HttpGet("me")]
    [Authorize]
    public async Task<IActionResult> GetMe(CancellationToken ct)
    {
        var sub = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
        if (!Guid.TryParse(sub, out var userId)) return Unauthorized();

        var user = await _usersService.GetByIdAsync(userId, ct);
        if (user is null) return NotFound();

        return Ok(new
        {
            id              = user.Id,
            firstName       = user.FirstName,
            lastName        = user.LastName,
            email           = user.Email,
            username        = user.Username,
            role            = user.Role.ToString(),
            meanRating      = user.MeanRating,
            totalTrips      = user.TotalTrips,
            kms             = user.Kms,
            profilePhotoUrl = user.ProfilePhotoUrl,
            qrToken         = user.QrToken,
        });
    }

    /// <summary>POST /api/users/me/photo — uploads the authenticated user's profile photo (base64).</summary>
    [HttpPost("me/photo")]
    [Authorize]
    public async Task<IActionResult> UploadMyPhoto([FromBody] UploadPhotoRequest dto, CancellationToken ct)
    {
        var sub = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
        if (!Guid.TryParse(sub, out var userId)) return Unauthorized();
        if (dto is null || string.IsNullOrWhiteSpace(dto.Image))
            return BadRequest(new { error = "La imagen es requerida." });

        try
        {
            var url = await _usersService.UpdateProfilePhotoAsync(userId, dto.Image, ct);
            return Ok(new { profilePhotoUrl = url });
        }
        catch (KeyNotFoundException)          { return NotFound(); }
        catch (InvalidOperationException ex)  { return BadRequest(new { error = ex.Message }); }
        catch (ArgumentException ex)          { return BadRequest(new { error = ex.Message }); }
        catch (Exception ex)                  { return Problem(detail: ex.Message, statusCode: 500); }
    }

    public sealed class UploadPhotoRequest
    {
        /// <summary>Base64-encoded JPEG (optionally with a data: prefix).</summary>
        public string Image { get; set; } = string.Empty;
    }

    // GET /api/users?search=&role=&status=&sortBy=name_asc&page=1&pageSize=30
    [HttpGet]
    [Authorize(Roles = "admin")]
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
    [Authorize(Roles = "admin")]
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
            IsActive        = user.IsActive,
            SuspendedUntil  = user.SuspendedUntil,
            CreatedAt       = user.CreatedAt,
            ProfilePhotoUrl = user.ProfilePhotoUrl,
        };
        return Ok(dto);
    }

    // PATCH /api/users/{id}/role  — body: { "role": "passenger" }
    [HttpPatch("{id:guid}/role")]
    [Authorize(Roles = "admin")]
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
    [Authorize(Roles = "admin")]
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
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> LiftBan(Guid id, CancellationToken ct)
    {
        try   { await _usersService.LiftBanAsync(id, ct); return NoContent(); }
        catch (KeyNotFoundException) { return NotFound(); }
    }

    // PATCH /api/users/{id}/deactivate
    [HttpPatch("{id:guid}/deactivate")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> Deactivate(Guid id, CancellationToken ct)
    {
        try   { await _usersService.DeactivateAsync(id, ct); return NoContent(); }
        catch (KeyNotFoundException) { return NotFound(); }
    }

    // PATCH /api/users/{id}/activate
    [HttpPatch("{id:guid}/activate")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> Activate(Guid id, CancellationToken ct)
    {
        try   { await _usersService.ActivateAsync(id, ct); return NoContent(); }
        catch (KeyNotFoundException) { return NotFound(); }
    }
}
