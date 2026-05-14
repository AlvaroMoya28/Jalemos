// Este archivo expone los endpoints HTTP del módulo Rides.
// Aquí debería traducirse la API REST a casos de uso de aplicación.

using JalemosBackend.Modules.Rides.Application;
using JalemosBackend.Modules.Rides.Domain;
using Microsoft.AspNetCore.Mvc;

namespace JalemosBackend.Modules.Rides.Presentation;

[ApiController]
[Route("api/rides")]
public sealed class TripsController : ControllerBase
{
    private readonly ITripsService _ridesService;

    public TripsController(ITripsService ridesService)
    {
        _ridesService = ridesService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Trip>>> GetAll(CancellationToken cancellationToken)
    {
        // TODO: devolver todos los viajes.
        var rides = await _ridesService.GetAllAsync(cancellationToken);
        return Ok(rides);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<Trip>> GetById(Guid id, CancellationToken cancellationToken)
    {
        // TODO: devolver un viaje por id.
        var ride = await _ridesService.GetByIdAsync(id, cancellationToken);
        return ride is null ? NotFound() : Ok(ride);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] Trip ride, CancellationToken cancellationToken)
    {
        // TODO: crear un viaje nuevo.
        await _ridesService.CreateAsync(ride, cancellationToken);
        return NoContent();
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] Trip ride, CancellationToken cancellationToken)
    {
        // TODO: actualizar un viaje existente.
        ride.Id = id;
        await _ridesService.UpdateAsync(ride, cancellationToken);
        return NoContent();
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        // TODO: eliminar un viaje.
        await _ridesService.DeleteAsync(id, cancellationToken);
        return NoContent();
    }
}
