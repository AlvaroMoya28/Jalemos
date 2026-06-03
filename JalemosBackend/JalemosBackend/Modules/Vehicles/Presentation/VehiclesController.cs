using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using JalemosBackend.Modules.Vehicles.Application;
using JalemosBackend.Modules.Vehicles.Domain;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace JalemosBackend.Modules.Vehicles.Presentation;

[ApiController]
[Route("api/vehicles")]
public sealed class VehiclesController : ControllerBase
{
    private readonly IVehiclesService _service;
    public VehiclesController(IVehiclesService service) => _service = service;

    // GET /api/vehicles/my — vehículos del usuario autenticado (para el perfil)
    [HttpGet("my")]
    [Authorize]
    public async Task<ActionResult<IEnumerable<Vehicle>>> GetMy(CancellationToken cancellationToken)
    {
        var sub = User.FindFirstValue(ClaimTypes.NameIdentifier)
               ?? User.FindFirstValue(JwtRegisteredClaimNames.Sub);
        if (!Guid.TryParse(sub, out var userId)) return Unauthorized();

        var vehicles = await _service.GetByUserIdAsync(userId, cancellationToken);
        return Ok(vehicles);
    }

    // GET /api/vehicles/{id}
    [HttpGet("{id:guid}")]
    public async Task<ActionResult<Vehicle>> GetById(Guid id, CancellationToken cancellationToken)
    {
        var vehicle = await _service.GetByIdAsync(id, cancellationToken);
        return vehicle is null ? NotFound() : Ok(vehicle);
    }

    // GET /api/vehicles/user/{userId}
    [HttpGet("user/{userId:guid}")]
    public async Task<ActionResult<IEnumerable<Vehicle>>> GetByUserId(Guid userId, CancellationToken cancellationToken)
    {
        var vehicles = await _service.GetByUserIdAsync(userId, cancellationToken);
        return Ok(vehicles);
    }

    // DELETE /api/vehicles/{id} — soft-delete, solo el dueño puede eliminarlo
    [HttpDelete("{id:guid}")]
    [Authorize]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        var sub = User.FindFirstValue(ClaimTypes.NameIdentifier)
               ?? User.FindFirstValue(JwtRegisteredClaimNames.Sub);
        if (!Guid.TryParse(sub, out var userId)) return Unauthorized();

        try
        {
            await _service.DeactivateAsync(id, userId, cancellationToken);
            return NoContent();
        }
        catch (KeyNotFoundException ex)       { return NotFound(new { detail = ex.Message }); }
        catch (UnauthorizedAccessException) { return Forbid(); }
        catch (InvalidOperationException ex)  { return Conflict(new { detail = ex.Message }); }
    }
}
