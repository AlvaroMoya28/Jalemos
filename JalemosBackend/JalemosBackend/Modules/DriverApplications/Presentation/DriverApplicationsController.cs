using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using JalemosBackend.Modules.DriverApplications.Application;
using JalemosBackend.Modules.DriverApplications.Application.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace JalemosBackend.Modules.DriverApplications.Presentation;

[ApiController]
[Route("api/driver-applications")]
[Authorize]
public sealed class DriverApplicationsController : ControllerBase
{
    private readonly IDriverApplicationsService _svc;

    public DriverApplicationsController(IDriverApplicationsService svc) => _svc = svc;

    // GET /api/driver-applications/my — devuelve la última solicitud del usuario autenticado
    [HttpGet("my")]
    public async Task<IActionResult> GetMy(CancellationToken ct)
    {
        var userId = GetUserId();
        var result = await _svc.GetMyApplicationAsync(userId, ct);
        return result is null ? NoContent() : Ok(result);
    }

    // GET /api/driver-applications?status=pending — solo admins
    [HttpGet]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> GetAll([FromQuery] string? status, CancellationToken ct)
    {
        var list = await _svc.GetAllAsync(status, ct);
        return Ok(list);
    }

    // GET /api/driver-applications/{id} — solo admins
    [HttpGet("{id:guid}")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
    {
        var result = await _svc.GetByIdAsync(id, ct);
        return result is null ? NotFound() : Ok(result);
    }

    // POST /api/driver-applications — pasajero envía nueva solicitud
    [HttpPost]
    public async Task<IActionResult> Submit([FromBody] SubmitApplicationRequest dto, CancellationToken ct)
    {
        try
        {
            var userId = GetUserId();
            var result = await _svc.SubmitAsync(userId, dto, ct);
            return CreatedAtAction(nameof(GetById), new { id = result.ApplicationId }, result);
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine($"[Submit] ERROR: {ex}");
            return Problem(detail: ex.Message, statusCode: 400);
        }
    }

    // POST /api/driver-applications/{id}/resubmit — pasajero reenvía con correcciones
    [HttpPost("{id:guid}/resubmit")]
    public async Task<IActionResult> Resubmit(Guid id, [FromBody] SubmitApplicationRequest dto, CancellationToken ct)
    {
        try
        {
            var userId = GetUserId();
            var result = await _svc.ResubmitAsync(id, userId, dto, ct);
            return Ok(result);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Forbid(ex.Message);
        }
        catch (InvalidOperationException ex)
        {
            return Problem(detail: ex.Message, statusCode: 400);
        }
    }

    // PATCH /api/driver-applications/{id}/under-review — admin marca en revisión
    [HttpPatch("{id:guid}/under-review")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> SetUnderReview(Guid id, CancellationToken ct)
    {
        try { await _svc.SetUnderReviewAsync(id, ct); return NoContent(); }
        catch (InvalidOperationException ex) { return Problem(detail: ex.Message, statusCode: 404); }
    }

    // PATCH /api/driver-applications/{id}/request-correction — admin pide correcciones
    [HttpPatch("{id:guid}/request-correction")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> RequestCorrection(Guid id, [FromBody] ReviewActionRequest dto, CancellationToken ct)
    {
        try { await _svc.RequestCorrectionAsync(id, dto, ct); return NoContent(); }
        catch (InvalidOperationException ex) { return Problem(detail: ex.Message, statusCode: 404); }
    }

    // PATCH /api/driver-applications/{id}/approve — admin aprueba
    [HttpPatch("{id:guid}/approve")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> Approve(Guid id, CancellationToken ct)
    {
        try { await _svc.ApproveAsync(id, ct); return NoContent(); }
        catch (InvalidOperationException ex) { return Problem(detail: ex.Message, statusCode: 404); }
    }

    // PATCH /api/driver-applications/{id}/reject — admin rechaza
    [HttpPatch("{id:guid}/reject")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> Reject(Guid id, [FromBody] ReviewActionRequest dto, CancellationToken ct)
    {
        try { await _svc.RejectAsync(id, dto, ct); return NoContent(); }
        catch (InvalidOperationException ex) { return Problem(detail: ex.Message, statusCode: 404); }
    }

    private Guid GetUserId() =>
        Guid.Parse(User.FindFirstValue(JwtRegisteredClaimNames.Sub)
            ?? User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? throw new InvalidOperationException("Token inválido: falta el claim sub."));
}
