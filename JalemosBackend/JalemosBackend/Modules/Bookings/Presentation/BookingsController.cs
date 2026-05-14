// Este archivo expone los endpoints HTTP del módulo Bookings.
// Aquí debería traducirse la API REST a casos de uso de aplicación.

using JalemosBackend.Modules.Bookings.Application;
using JalemosBackend.Modules.Bookings.Domain;
using Microsoft.AspNetCore.Mvc;

namespace JalemosBackend.Modules.Bookings.Presentation;

[ApiController]
[Route("api/bookings")]
public sealed class BookingsController : ControllerBase
{
    private readonly IBookingsService _bookingsService;

    public BookingsController(IBookingsService bookingsService)
    {
        _bookingsService = bookingsService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Booking>>> GetAll(CancellationToken cancellationToken)
    {
        var bookings = await _bookingsService.GetAllAsync(cancellationToken);
        return Ok(bookings);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<Booking>> GetById(Guid id, CancellationToken cancellationToken)
    {
        var booking = await _bookingsService.GetByIdAsync(id, cancellationToken);
        return booking is null ? NotFound() : Ok(booking);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] Booking booking, CancellationToken cancellationToken)
    {
        await _bookingsService.CreateAsync(booking, cancellationToken);
        return NoContent();
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] Booking booking, CancellationToken cancellationToken)
    {
        booking.Id = id;
        await _bookingsService.UpdateAsync(booking, cancellationToken);
        return NoContent();
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        await _bookingsService.DeleteAsync(id, cancellationToken);
        return NoContent();
    }
}
