// HTTP presentation layer for the Bookings module.
// Translates incoming REST requests into application service calls and maps results to HTTP responses.
// No business logic should live here — delegate all decisions to IBookingsService.

using JalemosBackend.Modules.Bookings.Application;
using JalemosBackend.Modules.Bookings.Application.DTOs;
using JalemosBackend.Modules.Bookings.Domain;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.Extensions.Logging;


namespace JalemosBackend.Modules.Bookings.Presentation;

/// <summary>
/// Exposes CRUD endpoints for bookings under the /api/bookings route.
/// </summary>
[ApiController]
[Route("api/bookings")]
[Authorize]
public sealed class BookingsController : ControllerBase
{
    private readonly IBookingsService _bookingsService;
    private readonly ILogger<BookingsController> _logger;

    /// <summary>Injects the bookings application service.</summary>
    public BookingsController(IBookingsService bookingsService, ILogger<BookingsController> logger)
    {
        _bookingsService = bookingsService;
        _logger = logger;
    }

    /// <summary>GET /api/bookings/mine — caller's own bookings with embedded trip snapshot (all states).</summary>
    [HttpGet("mine")]
    public async Task<IActionResult> GetMine(CancellationToken cancellationToken)
    {
        var sub = User.FindFirstValue(JwtRegisteredClaimNames.Sub) ?? User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(sub) || !Guid.TryParse(sub, out var callerId))
            return Unauthorized(new { error = "Invalid or missing authentication token" });
        try
        {
            var result = await _bookingsService.GetMyBookingsWithTripsAsync(callerId, cancellationToken);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[Bookings.GetMine] unexpected error");
            return StatusCode(500, new { error = ex.Message });
        }
    }

    /// <summary>GET /api/bookings — retrieves all bookings.</summary>
    [HttpGet]
    public async Task<ActionResult<IEnumerable<BookingDto>>> GetAll(CancellationToken cancellationToken)
    {
        var bookings = await _bookingsService.GetAllAsync(cancellationToken);
        var dtos = bookings.Select(b => new BookingDto
        {
            Id = b.Id,
            TripId = b.TripId,
            PassengerId = b.PassengerId,
            SeatsReserved = b.SeatsReserved,
            EstimatedAmount = b.EstimatedAmount,
            State = b.State.ToString(),
            CreatedAt = b.CreatedAt
        });
        return Ok(dtos);
    }

    /// <summary>GET /api/bookings/{id} — retrieves a single booking by GUID. Returns 404 if not found.</summary>
    [HttpGet("{id:guid}")]
    public async Task<ActionResult<BookingDto>> GetById(Guid id, CancellationToken cancellationToken)
    {
        var booking = await _bookingsService.GetByIdAsync(id, cancellationToken);
        return booking is null ? NotFound() : Ok(new BookingDto
        {
            Id = booking.Id,
            TripId = booking.TripId,
            PassengerId = booking.PassengerId,
            SeatsReserved = booking.SeatsReserved,
            EstimatedAmount = booking.EstimatedAmount,
            State = booking.State.ToString(),
            CreatedAt = booking.CreatedAt
        });
    }

    /// <summary>POST /api/bookings — creates a new booking. The authenticated user is the passenger.</summary>
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateBookingDto dto, CancellationToken cancellationToken)
    {
        if (dto is null)
        {
            _logger.LogWarning("[Bookings.Create] request body was null");
            return BadRequest(new { error = "Request body is null or malformed" });
        }

        var sub = User.FindFirstValue(JwtRegisteredClaimNames.Sub) ?? User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(sub) || !Guid.TryParse(sub, out var callerId))
            return Unauthorized(new { error = "Invalid or missing authentication token" });

        try
        {
            var resultDto = await _bookingsService.CreateAsync(dto, callerId, cancellationToken);
            return CreatedAtAction(nameof(GetById), new { id = resultDto.Id }, resultDto);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "[Bookings.Create] business validation failed");
            return BadRequest(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[Bookings.Create] unexpected error");
            return StatusCode(500, new { error = ex.Message });
        }
    }

    /// <summary>PUT /api/bookings/{id} — updates an existing booking. The route id overrides the body id for safety.</summary>
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] Booking booking, CancellationToken cancellationToken)
    {
        // Ensure the id from the route is authoritative, not whatever was in the body
        booking.Id = id;
        var sub = User.FindFirstValue(JwtRegisteredClaimNames.Sub) ?? User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(sub) || !Guid.TryParse(sub, out var callerId))
            return Unauthorized(new { error = "Invalid or missing authentication token" });

        try
        {
            await _bookingsService.UpdateAsync(booking, callerId, cancellationToken);
            return NoContent();
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning(ex, "[Bookings.Update] unauthorized");
            return Forbid();
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "[Bookings.Update] validation failed");
            return BadRequest(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[Bookings.Update] unexpected error");
            return StatusCode(500, new { error = ex.Message });
        }
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        var sub = User.FindFirstValue(JwtRegisteredClaimNames.Sub) ?? User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(sub) || !Guid.TryParse(sub, out var callerId))
            return Unauthorized(new { error = "Invalid or missing authentication token" });

        try
        {
            await _bookingsService.DeleteAsync(id, callerId, cancellationToken);
            return NoContent();
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning(ex, "[Bookings.Delete] unauthorized");
            return Forbid();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[Bookings.Delete] unexpected error");
            return StatusCode(500, new { error = ex.Message });
        }
    }

    /// <summary>POST /api/bookings/{id}/cancel — passenger cancels their own booking with a reason.</summary>
    [HttpPost("{id:guid}/cancel")]
    public async Task<IActionResult> CancelBooking(Guid id, [FromBody] CancelBookingDto dto, CancellationToken cancellationToken)
    {
        var sub = User.FindFirstValue(JwtRegisteredClaimNames.Sub) ?? User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(sub) || !Guid.TryParse(sub, out var callerId))
            return Unauthorized(new { error = "Invalid or missing authentication token" });

        try
        {
            await _bookingsService.CancelBookingAsync(id, dto.Reason, dto.Details, callerId, cancellationToken);
            return NoContent();
        }
        catch (KeyNotFoundException)             { return NotFound(); }
        catch (UnauthorizedAccessException)      { return Forbid(); }
        catch (InvalidOperationException ex)     { return BadRequest(new { error = ex.Message }); }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[Bookings.Cancel] unexpected error");
            return StatusCode(500, new { error = ex.Message });
        }
    }
}
