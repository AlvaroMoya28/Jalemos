using JalemosBackend.Modules.Vehicles.Application;
using JalemosBackend.Modules.Vehicles.Domain;
using Microsoft.AspNetCore.Mvc;

namespace JalemosBackend.Modules.Vehicles.Presentation;

[ApiController]
[Route("api/vehicles")]
public sealed class VehiclesController : ControllerBase
{
    private readonly IVehiclesService _service;
    public VehiclesController(IVehiclesService service) => _service = service;

    /// <summary>GET /api/vehicles/{id} — returns a single vehicle. 404 if not found.</summary>
    [HttpGet("{id:guid}")]
    public async Task<ActionResult<Vehicle>> GetById(Guid id, CancellationToken cancellationToken)
    {
        var vehicle = await _service.GetByIdAsync(id, cancellationToken);
        return vehicle is null ? NotFound() : Ok(vehicle);
    }

    /// <summary>GET /api/vehicles/user/{userId} — returns all active vehicles for a driver.</summary>
    [HttpGet("user/{userId:guid}")]
    public async Task<ActionResult<IEnumerable<Vehicle>>> GetByUserId(Guid userId, CancellationToken cancellationToken)
    {
        var vehicles = await _service.GetByUserIdAsync(userId, cancellationToken);
        return Ok(vehicles);
    }
}
