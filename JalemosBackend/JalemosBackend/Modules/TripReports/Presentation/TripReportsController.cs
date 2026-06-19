using JalemosBackend.Infrastructure.Persistence;
using JalemosBackend.Modules.TripReports.Application;
using JalemosBackend.Modules.TripReports.Application.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace JalemosBackend.Modules.TripReports.Presentation;

[ApiController]
[Route("api/trip-reports")]
[Authorize]
public sealed class TripReportsController : ControllerBase
{
    private readonly ITripReportsService _service;
    private readonly ILogger<TripReportsController> _logger;

    public TripReportsController(ITripReportsService service, ILogger<TripReportsController> logger)
    {
        _service = service;
        _logger  = logger;
    }

    /// <summary>POST /api/trip-reports — authenticated passenger creates a report during in_progress trip.</summary>
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateTripReportDto dto, CancellationToken ct)
    {
        var callerId = ExtractCallerId();
        if (callerId == Guid.Empty) return Unauthorized(new { error = "Token inválido." });

        try
        {
            var result = await _service.CreateAsync(dto, callerId, ct);
            return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
        }
        catch (KeyNotFoundException ex)     { return NotFound(new { error = ex.Message }); }
        catch (InvalidOperationException ex) { return BadRequest(new { error = ex.Message }); }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[TripReports.Create] unexpected error");
            return StatusCode(500, new { error = ex.Message });
        }
    }

    /// <summary>GET /api/trip-reports — admin: paginated list, optional ?status= filter.</summary>
    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] string? status, [FromQuery] int page = 1, [FromQuery] int pageSize = 50, CancellationToken ct = default)
    {
        if (!IsAdmin()) return Forbid();

        TripReportStatus? parsedStatus = status?.Trim().ToLower() switch
        {
            "open"         => TripReportStatus.Open,
            "verified"     => TripReportStatus.Verified,
            "dismissed"    => TripReportStatus.Dismissed,
            "action_taken" => TripReportStatus.ActionTaken,
            _              => null,
        };

        try
        {
            var results = await _service.GetAllAsync(parsedStatus, page, pageSize, ct);
            return Ok(results);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[TripReports.GetAll] unexpected error");
            return StatusCode(500, new { error = ex.Message });
        }
    }

    /// <summary>GET /api/trip-reports/{id} — admin: single report.</summary>
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
    {
        if (!IsAdmin()) return Forbid();

        var result = await _service.GetByIdAsync(id, ct);
        return result is null ? NotFound() : Ok(result);
    }

    /// <summary>PATCH /api/trip-reports/{id}/status — admin: transition report status.</summary>
    [HttpPatch("{id:guid}/status")]
    public async Task<IActionResult> UpdateStatus(Guid id, [FromBody] UpdateTripReportStatusDto dto, CancellationToken ct)
    {
        if (!IsAdmin()) return Forbid();

        try
        {
            var result = await _service.UpdateStatusAsync(id, dto, ct);
            return Ok(result);
        }
        catch (KeyNotFoundException ex)     { return NotFound(new { error = ex.Message }); }
        catch (InvalidOperationException ex) { return BadRequest(new { error = ex.Message }); }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[TripReports.UpdateStatus] unexpected error");
            return StatusCode(500, new { error = ex.Message });
        }
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private Guid ExtractCallerId()
    {
        var sub = User.FindFirstValue(JwtRegisteredClaimNames.Sub)
               ?? User.FindFirstValue(ClaimTypes.NameIdentifier);
        return Guid.TryParse(sub, out var id) ? id : Guid.Empty;
    }

    private bool IsAdmin()
    {
        var role = User.FindFirstValue(ClaimTypes.Role)
                ?? User.FindFirstValue("role");
        return role == "admin";
    }
}
