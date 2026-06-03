// HTTP presentation layer for the Trips module.
// Maps REST requests to ITripsService use cases and converts results to HTTP responses.
// Keep this layer thin — all business logic belongs in the service.

using JalemosBackend.Modules.Trips.Application;
using JalemosBackend.Modules.Trips.Application.DTOs;
using JalemosBackend.Modules.Trips.Domain;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace JalemosBackend.Modules.Trips.Presentation;

[ApiController]
[Route("api/trips")]
public sealed class TripsController : ControllerBase
{
    private readonly ITripsService _ridesService;
    private readonly ITripLifecycleService _lifecycle;
    private readonly ILogger<TripsController> _logger;

    public TripsController(ITripsService ridesService, ITripLifecycleService lifecycle, ILogger<TripsController> logger)
    {
        _ridesService = ridesService;
        _lifecycle    = lifecycle;
        _logger       = logger;
    }

    private Guid? GetCallerId() =>
        Guid.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub"), out var id) ? id : null;

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

    /// <summary>POST /api/trips — creates and publishes a new trip. Caller must be a driver.</summary>
    [HttpPost]
    [Authorize]
    public async Task<IActionResult> Create([FromBody] Trip? ride, CancellationToken cancellationToken)
    {
        if (ride is null)
        {
            _logger.LogWarning("[Trips.Create] Body deserialized as null — check Content-Type and JSON shape");
            return BadRequest(new { error = "Request body is null or malformed" });
        }

        var callerId = GetCallerId();
        if (callerId is null) return Unauthorized();

        if (!User.IsInRole("driver"))
            return Forbid();

        // Ignore any driverId in the body — always use the authenticated caller
        ride.DriverId = callerId.Value;

        _logger.LogInformation(
            "[Trips.Create] driverId={DriverId} vehicleId={VehicleId} origin={Origin} destination={Destination} departure={DepartureAt} seats={TotalSeats} rate={Rate}",
            ride.DriverId, ride.VehicleId, ride.Origin, ride.Destination, ride.DepartureAt, ride.TotalSeats, ride.Rate);

        try
        {
            await _ridesService.CreateAsync(ride, cancellationToken);
            _logger.LogInformation("[Trips.Create] Trip created successfully, id={TripId}", ride.Id);
            return NoContent();
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning("[Trips.Create] Business rule violation: {Message}", ex.Message);
            return BadRequest(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[Trips.Create] Failed to create trip for driverId={DriverId}", ride.DriverId);
            return StatusCode(500, new { error = ex.Message });
        }
    }

    /// <summary>PUT /api/trips/{id} — updates a trip. Route id takes precedence over body id.</summary>
    [HttpPut("{id:guid}")]
    [Authorize]
    public async Task<IActionResult> Update(Guid id, [FromBody] Trip ride, CancellationToken cancellationToken)
    {
        // Enforce the route id so clients cannot change the primary key via the request body
        ride.Id = id;
        await _ridesService.UpdateAsync(ride, cancellationToken);
        return NoContent();
    }

    [HttpDelete("{id:guid}")]
    [Authorize]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        await _ridesService.DeleteAsync(id, cancellationToken);
        return NoContent();
    }

    // ── Lifecycle ────────────────────────────────────────────────────────

    /// <summary>GET /api/trips/active-driver — active boarding/in_progress trip for the authenticated driver.</summary>
    [HttpGet("active-driver")]
    [Authorize]
    public async Task<IActionResult> GetActiveDriverTrip(CancellationToken ct)
    {
        var callerId = GetCallerId();
        if (callerId is null) return Unauthorized();
        try
        {
            var status = await _lifecycle.GetActiveDriverTripAsync(callerId.Value, ct);
            return Ok(status);
        }
        catch (Exception ex) { return Problem(detail: ex.Message, statusCode: 500); }
    }

    /// <summary>GET /api/trips/active-passenger — active trip for the authenticated passenger.</summary>
    [HttpGet("active-passenger")]
    [Authorize]
    public async Task<IActionResult> GetActivePassengerTrip(CancellationToken ct)
    {
        var callerId = GetCallerId();
        if (callerId is null) return Unauthorized();
        try
        {
            var dto = await _lifecycle.GetActivePassengerTripAsync(callerId.Value, ct);
            return Ok(dto);
        }
        catch (Exception ex) { return Problem(detail: ex.Message, statusCode: 500); }
    }

    /// <summary>GET /api/trips/{id}/status — full trip status including passenger list.</summary>
    [HttpGet("{id:guid}/status")]
    [Authorize]
    public async Task<IActionResult> GetStatus(Guid id, CancellationToken ct)
    {
        var callerId = GetCallerId();
        if (callerId is null) return Unauthorized();
        try
        {
            var status = await _lifecycle.GetTripStatusAsync(id, callerId.Value, ct);
            return Ok(status);
        }
        catch (KeyNotFoundException)           { return NotFound(); }
        catch (UnauthorizedAccessException ex) { return Forbid(); }
        catch (Exception ex)                   { return Problem(detail: ex.Message, statusCode: 500); }
    }

    /// <summary>POST /api/trips/{id}/start-boarding — driver starts the boarding phase.</summary>
    [HttpPost("{id:guid}/start-boarding")]
    [Authorize]
    public async Task<IActionResult> StartBoarding(Guid id, CancellationToken ct)
    {
        var callerId = GetCallerId();
        if (callerId is null) return Unauthorized();
        try
        {
            var status = await _lifecycle.StartBoardingAsync(id, callerId.Value, ct);
            return Ok(status);
        }
        catch (KeyNotFoundException)             { return NotFound(); }
        catch (UnauthorizedAccessException ex)   { return Forbid(); }
        catch (InvalidOperationException ex)     { return BadRequest(new { error = ex.Message }); }
        catch (Exception ex)                     { return Problem(detail: ex.Message, statusCode: 500); }
    }

    /// <summary>POST /api/trips/{id}/scan-qr — driver scans a passenger QR code.</summary>
    [HttpPost("{id:guid}/scan-qr")]
    [Authorize]
    public async Task<IActionResult> ScanQr(Guid id, [FromBody] ScanQrDto dto, CancellationToken ct)
    {
        var callerId = GetCallerId();
        if (callerId is null) return Unauthorized();
        try
        {
            var result = await _lifecycle.ScanQrAsync(id, dto.QrToken, callerId.Value, ct);
            return Ok(result);
        }
        catch (KeyNotFoundException ex)          { return NotFound(new { error = ex.Message }); }
        catch (UnauthorizedAccessException)      { return Forbid(); }
        catch (InvalidOperationException ex)     { return BadRequest(new { error = ex.Message }); }
        catch (ArgumentException ex)             { return BadRequest(new { error = ex.Message }); }
        catch (Exception ex)                     { return Problem(detail: ex.Message, statusCode: 500); }
    }

    /// <summary>POST /api/trips/{id}/start-journey — driver starts the journey (all aboard).</summary>
    [HttpPost("{id:guid}/start-journey")]
    [Authorize]
    public async Task<IActionResult> StartJourney(Guid id, CancellationToken ct)
    {
        var callerId = GetCallerId();
        if (callerId is null) return Unauthorized();
        try
        {
            var status = await _lifecycle.StartJourneyAsync(id, callerId.Value, ct);
            return Ok(status);
        }
        catch (KeyNotFoundException)           { return NotFound(); }
        catch (UnauthorizedAccessException)    { return Forbid(); }
        catch (InvalidOperationException ex)   { return BadRequest(new { error = ex.Message }); }
        catch (Exception ex)                   { return Problem(detail: ex.Message, statusCode: 500); }
    }

    /// <summary>POST /api/trips/{id}/complete — driver marks the trip as completed.</summary>
    [HttpPost("{id:guid}/complete")]
    [Authorize]
    public async Task<IActionResult> Complete(Guid id, CancellationToken ct)
    {
        var callerId = GetCallerId();
        if (callerId is null) return Unauthorized();
        try
        {
            var status = await _lifecycle.CompleteTripAsync(id, callerId.Value, ct);
            return Ok(status);
        }
        catch (KeyNotFoundException)           { return NotFound(); }
        catch (UnauthorizedAccessException)    { return Forbid(); }
        catch (InvalidOperationException ex)   { return BadRequest(new { error = ex.Message }); }
        catch (Exception ex)                   { return Problem(detail: ex.Message, statusCode: 500); }
    }

    /// <summary>POST /api/trips/{id}/cancel — driver or admin cancels the trip.</summary>
    [HttpPost("{id:guid}/cancel")]
    [Authorize]
    public async Task<IActionResult> Cancel(Guid id, [FromBody] CancelTripDto dto, CancellationToken ct)
    {
        var callerId = GetCallerId();
        if (callerId is null) return Unauthorized();
        var isAdmin = User.IsInRole("admin");
        try
        {
            await _lifecycle.CancelTripAsync(id, dto.Reason, dto.Details, callerId.Value, isAdmin, ct);
            return NoContent();
        }
        catch (KeyNotFoundException)           { return NotFound(); }
        catch (UnauthorizedAccessException)    { return Forbid(); }
        catch (InvalidOperationException ex)   { return BadRequest(new { error = ex.Message }); }
        catch (Exception ex)                   { return Problem(detail: ex.Message, statusCode: 500); }
    }

    /// <summary>POST /api/trips/bookings/{bookingId}/no-show — driver marks passenger as no-show.</summary>
    [HttpPost("bookings/{bookingId:guid}/no-show")]
    [Authorize]
    public async Task<IActionResult> MarkNoShow(Guid bookingId, CancellationToken ct)
    {
        var callerId = GetCallerId();
        if (callerId is null) return Unauthorized();
        try
        {
            await _lifecycle.MarkNoShowAsync(bookingId, callerId.Value, ct);
            return NoContent();
        }
        catch (KeyNotFoundException ex)        { return NotFound(new { error = ex.Message }); }
        catch (UnauthorizedAccessException)    { return Forbid(); }
        catch (InvalidOperationException ex)   { return BadRequest(new { error = ex.Message }); }
        catch (Exception ex)                   { return Problem(detail: ex.Message, statusCode: 500); }
    }
}
