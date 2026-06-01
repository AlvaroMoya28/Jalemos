// HTTP presentation layer for the Trips module.
// Maps REST requests to ITripsService use cases and converts results to HTTP responses.
// Keep this layer thin — all business logic belongs in the service.

using JalemosBackend.Modules.Trips.Application;
using JalemosBackend.Modules.Trips.Domain;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace JalemosBackend.Modules.Trips.Presentation;

/// <summary>
/// Exposes CRUD endpoints for trips (rides) under the /api/rides route.
/// </summary>
[ApiController]
[Route("api/trips")]
public sealed class TripsController : ControllerBase
{
    private readonly ITripsService _ridesService;
    private readonly ILogger<TripsController> _logger;

    /// <summary>Injects the trips application service.</summary>
    public TripsController(ITripsService ridesService, ILogger<TripsController> logger)
    {
        _ridesService = ridesService;
        _logger = logger;
    }

    /// <summary>GET /api/trips — returns all trips with embedded driver info. Requires authentication.</summary>
    [HttpGet]
    [Authorize]
    public async Task<ActionResult<IEnumerable<TripDto>>> GetAll(CancellationToken cancellationToken)
    {
        try
        {
            var rides = await _ridesService.GetAllWithDriverAsync(cancellationToken);
            return Ok(rides);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[Trips.GetAll] Failed to fetch trips");
            return StatusCode(500, new { error = ex.Message });
        }
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
    public async Task<IActionResult> Create([FromBody] Trip? ride, CancellationToken cancellationToken)
    {
        if (ride is null)
        {
            _logger.LogWarning("[Trips.Create] Body deserialized as null — check Content-Type and JSON shape");
            return BadRequest(new { error = "Request body is null or malformed" });
        }

        _logger.LogInformation(
            "[Trips.Create] driverId={DriverId} vehicleId={VehicleId} origin={Origin} destination={Destination} departure={DepartureAt} seats={TotalSeats} rate={Rate}",
            ride.DriverId, ride.VehicleId, ride.Origin, ride.Destination, ride.DepartureAt, ride.TotalSeats, ride.Rate);

        try
        {
            await _ridesService.CreateAsync(ride, cancellationToken);
            _logger.LogInformation("[Trips.Create] Trip created successfully, id={TripId}", ride.Id);
            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[Trips.Create] Failed to create trip for driverId={DriverId}", ride.DriverId);
            return StatusCode(500, new { error = ex.Message });
        }
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
