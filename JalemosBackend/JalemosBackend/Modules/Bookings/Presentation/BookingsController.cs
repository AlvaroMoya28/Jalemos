// HTTP presentation layer for the Bookings module.
// Translates incoming REST requests into application service calls and maps results to HTTP responses.
// No business logic should live here — delegate all decisions to IBookingsService.

using JalemosBackend.Modules.Bookings.Application;
using JalemosBackend.Modules.Bookings.Domain;
using Microsoft.AspNetCore.Mvc;

namespace JalemosBackend.Modules.Bookings.Presentation;

/// <summary>
/// Exposes CRUD endpoints for bookings under the /api/bookings route.
/// </summary>
[ApiController]
[Route("api/bookings")]
public sealed class BookingsController : ControllerBase
{
    private readonly IBookingsService _bookingsService;

    /// <summary>Injects the bookings application service.</summary>
    public BookingsController(IBookingsService bookingsService)
    {
        _bookingsService = bookingsService;
    }

    /// <summary>GET /api/bookings — retrieves all bookings.</summary>
    [HttpGet]
    public async Task<ActionResult<IEnumerable<Booking>>> GetAll(CancellationToken cancellationToken)
    {
        var bookings = await _bookingsService.GetAllAsync(cancellationToken);
        return Ok(bookings);
    }

    /// <summary>GET /api/bookings/{id} — retrieves a single booking by GUID. Returns 404 if not found.</summary>
    [HttpGet("{id:guid}")]
    public async Task<ActionResult<Booking>> GetById(Guid id, CancellationToken cancellationToken)
    {
        var booking = await _bookingsService.GetByIdAsync(id, cancellationToken);
        return booking is null ? NotFound() : Ok(booking);
    }

    /// <summary>POST /api/bookings — creates a new booking from the request body.</summary>
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] Booking booking, CancellationToken cancellationToken)
    {
        await _bookingsService.CreateAsync(booking, cancellationToken);
        return NoContent();
    }

    /// <summary>PUT /api/bookings/{id} — updates an existing booking. The route id overrides the body id for safety.</summary>
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] Booking booking, CancellationToken cancellationToken)
    {
        // Ensure the id from the route is authoritative, not whatever was in the body
        booking.Id = id;
        await _bookingsService.UpdateAsync(booking, cancellationToken);
        return NoContent();
    }

    /// <summary>DELETE /api/bookings/{id} — deletes the specified booking.</summary>
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        await _bookingsService.DeleteAsync(id, cancellationToken);
        return NoContent();
    }
}
