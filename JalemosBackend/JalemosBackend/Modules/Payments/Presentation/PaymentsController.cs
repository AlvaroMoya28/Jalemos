using JalemosBackend.Modules.Payments.Application;
using JalemosBackend.Modules.Payments.Application.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace JalemosBackend.Modules.Payments.Presentation;

[ApiController]
[Route("api/payments")]
[Authorize]
public sealed class PaymentsController : ControllerBase
{
    private readonly IPaymentsService _service;
    private readonly ILogger<PaymentsController> _logger;

    public PaymentsController(IPaymentsService service, ILogger<PaymentsController> logger)
    {
        _service = service;
        _logger  = logger;
    }

    private Guid? GetCallerId()
    {
        var sub = User.FindFirstValue(JwtRegisteredClaimNames.Sub)
               ?? User.FindFirstValue(ClaimTypes.NameIdentifier);
        return Guid.TryParse(sub, out var id) ? id : null;
    }

    // ── Payment methods ───────────────────────────────────────────────────

    /// <summary>GET /api/payments/methods — caller's active payment methods.</summary>
    [HttpGet("methods")]
    public async Task<IActionResult> GetMethods(CancellationToken ct)
    {
        var callerId = GetCallerId();
        if (callerId is null) return Unauthorized();
        try
        {
            var result = await _service.GetMyPaymentMethodsAsync(callerId.Value, ct);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[Payments.GetMethods]");
            return StatusCode(500, new { error = ex.Message });
        }
    }

    /// <summary>POST /api/payments/methods/card — add a card via Stripe PaymentMethod ID.</summary>
    [HttpPost("methods/card")]
    public async Task<IActionResult> AddCard([FromBody] CreateCardPaymentMethodDto dto, CancellationToken ct)
    {
        var callerId = GetCallerId();
        if (callerId is null) return Unauthorized();
        try
        {
            var result = await _service.AddCardAsync(dto, callerId.Value, ct);
            return Ok(result);
        }
        catch (InvalidOperationException ex) { return BadRequest(new { error = ex.Message }); }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[Payments.AddCard]");
            return StatusCode(500, new { error = ex.Message });
        }
    }

    /// <summary>POST /api/payments/methods/simple — add sinpe or cash method.</summary>
    [HttpPost("methods/simple")]
    public async Task<IActionResult> AddSimple([FromBody] AddSimplePaymentMethodDto dto, CancellationToken ct)
    {
        var callerId = GetCallerId();
        if (callerId is null) return Unauthorized();
        try
        {
            var result = await _service.AddSimpleMethodAsync(dto, callerId.Value, ct);
            return Ok(result);
        }
        catch (InvalidOperationException ex) { return BadRequest(new { error = ex.Message }); }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[Payments.AddSimple]");
            return StatusCode(500, new { error = ex.Message });
        }
    }

    /// <summary>PATCH /api/payments/methods/{id}/favorite — mark a method as favorite.</summary>
    [HttpPatch("methods/{id:guid}/favorite")]
    public async Task<IActionResult> SetFavorite(Guid id, CancellationToken ct)
    {
        var callerId = GetCallerId();
        if (callerId is null) return Unauthorized();
        try
        {
            await _service.SetFavoriteAsync(id, callerId.Value, ct);
            return NoContent();
        }
        catch (KeyNotFoundException)          { return NotFound(); }
        catch (UnauthorizedAccessException)   { return Forbid(); }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[Payments.SetFavorite]");
            return StatusCode(500, new { error = ex.Message });
        }
    }

    /// <summary>DELETE /api/payments/methods/{id} — remove a payment method.</summary>
    [HttpDelete("methods/{id:guid}")]
    public async Task<IActionResult> DeleteMethod(Guid id, CancellationToken ct)
    {
        var callerId = GetCallerId();
        if (callerId is null) return Unauthorized();
        try
        {
            await _service.DeletePaymentMethodAsync(id, callerId.Value, ct);
            return NoContent();
        }
        catch (KeyNotFoundException)          { return NotFound(); }
        catch (UnauthorizedAccessException)   { return Forbid(); }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[Payments.DeleteMethod]");
            return StatusCode(500, new { error = ex.Message });
        }
    }

    /// <summary>GET /api/payments/methods/last-used — caller's last used payment method.</summary>
    [HttpGet("methods/last-used")]
    public async Task<IActionResult> GetLastUsed(CancellationToken ct)
    {
        var callerId = GetCallerId();
        if (callerId is null) return Unauthorized();
        try
        {
            var result = await _service.GetLastUsedMethodAsync(callerId.Value, ct);
            return result is null ? NoContent() : Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[Payments.GetLastUsed]");
            return StatusCode(500, new { error = ex.Message });
        }
    }

    // ── Payments ──────────────────────────────────────────────────────────

    /// <summary>POST /api/payments — create and process a payment for a booking.</summary>
    [HttpPost]
    public async Task<IActionResult> CreatePayment([FromBody] CreatePaymentDto dto, CancellationToken ct)
    {
        var callerId = GetCallerId();
        if (callerId is null) return Unauthorized();
        try
        {
            var result = await _service.CreatePaymentAsync(dto, callerId.Value, ct);
            return Ok(result);
        }
        catch (InvalidOperationException ex)  { return BadRequest(new { error = ex.Message }); }
        catch (KeyNotFoundException ex)        { return NotFound(new { error = ex.Message }); }
        catch (UnauthorizedAccessException)    { return Forbid(); }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[Payments.CreatePayment]");
            return StatusCode(500, new { error = ex.Message });
        }
    }

    /// <summary>POST /api/payments/{id}/confirm — driver confirms sinpe or cash receipt.</summary>
    [HttpPost("{id:guid}/confirm")]
    public async Task<IActionResult> ConfirmPayment(Guid id, CancellationToken ct)
    {
        var callerId = GetCallerId();
        if (callerId is null) return Unauthorized();
        try
        {
            var result = await _service.ConfirmPaymentAsync(id, callerId.Value, ct);
            return Ok(result);
        }
        catch (KeyNotFoundException)          { return NotFound(); }
        catch (InvalidOperationException ex)  { return BadRequest(new { error = ex.Message }); }
        catch (UnauthorizedAccessException)   { return Forbid(); }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[Payments.ConfirmPayment]");
            return StatusCode(500, new { error = ex.Message });
        }
    }

    /// <summary>GET /api/payments/booking/{bookingId} — payment record for a booking.</summary>
    [HttpGet("booking/{bookingId:guid}")]
    public async Task<IActionResult> GetByBooking(Guid bookingId, CancellationToken ct)
    {
        var callerId = GetCallerId();
        if (callerId is null) return Unauthorized();
        try
        {
            var result = await _service.GetPaymentByBookingAsync(bookingId, callerId.Value, ct);
            return result is null ? NotFound() : Ok(result);
        }
        catch (UnauthorizedAccessException)   { return Forbid(); }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[Payments.GetByBooking]");
            return StatusCode(500, new { error = ex.Message });
        }
    }
}
