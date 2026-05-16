// HTTP presentation layer for the Trips module.
// Maps REST requests to ITripsService use cases and converts results to HTTP responses.
// Keep this layer thin — all business logic belongs in the service.

using JalemosBackend.Modules.Rides.Application;
using JalemosBackend.Modules.Rides.Domain;
using Microsoft.AspNetCore.Mvc;

namespace JalemosBackend.Modules.Rides.Presentation;

/// <summary>
/// Exposes CRUD endpoints for trips (rides) under the /api/rides route.
/// </summary>
[ApiController]
[Route("api/rides")]
public sealed class TripsController : ControllerBase
{
    private readonly ITripsService _ridesService;

    /// <summary>Injects the trips application service.</summary>
    public TripsController(ITripsService ridesService)
    {
        _ridesService = ridesService;
    }

    /// <summary>GET /api/rides — returns all available trips.</summary>
    [HttpGet]
    public async Task<ActionResult<IEnumerable<Trip>>> GetAll(CancellationToken cancellationToken)
    {
        var rides = await _ridesService.GetAllAsync(cancellationToken);
        return Ok(rides);
    }

    /// <summary>GET /api/rides/{id} — returns a single trip. 404 if not found.</summary>
    [HttpGet("{id:guid}")]
    public async Task<ActionResult<Trip>> GetById(Guid id, CancellationToken cancellationToken)
    {
        var ride = await _ridesService.GetByIdAsync(id, cancellationToken);
        return ride is null ? NotFound() : Ok(ride);
    }

    /// <summary>POST /api/rides — creates and publishes a new trip.</summary>
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] Trip ride, CancellationToken cancellationToken)
    {
        await _ridesService.CreateAsync(ride, cancellationToken);
        return NoContent();
    }

    /// <summary>PUT /api/rides/{id} — updates a trip. Route id takes precedence over body id.</summary>
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] Trip ride, CancellationToken cancellationToken)
    {
        // Enforce the route id so clients cannot change the primary key via the request body
        ride.Id = id;
        await _ridesService.UpdateAsync(ride, cancellationToken);
        return NoContent();
    }

    /// <summary>DELETE /api/rides/{id} — deletes the specified trip.</summary>
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        await _ridesService.DeleteAsync(id, cancellationToken);
        return NoContent();
    }
}
