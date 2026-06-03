using JalemosBackend.Modules.Ratings.Application;
using JalemosBackend.Modules.Ratings.Application.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace JalemosBackend.Modules.Ratings.Presentation;

[ApiController]
[Route("api/ratings")]
[Authorize]
public sealed class RatingsController : ControllerBase
{
    private readonly IRatingsService _svc;
    public RatingsController(IRatingsService svc) => _svc = svc;

    private Guid? CallerId() =>
        Guid.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub"), out var id) ? id : null;

    /// <summary>GET /api/ratings/user/{userId} — all ratings received by a user (public).</summary>
    [HttpGet("user/{userId:guid}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetByUser(Guid userId, CancellationToken ct)
    {
        var ratings = await _svc.GetByRatedUserAsync(userId, ct);
        return Ok(ratings);
    }

    /// <summary>POST /api/ratings — submit a rating for a trip participant.</summary>
    [HttpPost]
    public async Task<IActionResult> Submit([FromBody] SubmitRatingDto dto, CancellationToken ct)
    {
        var callerId = CallerId();
        if (callerId is null) return Unauthorized();
        try
        {
            var result = await _svc.SubmitAsync(dto, callerId.Value, ct);
            return CreatedAtAction(nameof(GetByUser), new { userId = dto.RatedId }, result);
        }
        catch (KeyNotFoundException ex)        { return NotFound(new { error = ex.Message }); }
        catch (UnauthorizedAccessException)    { return Forbid(); }
        catch (ArgumentException ex)           { return BadRequest(new { error = ex.Message }); }
        catch (InvalidOperationException ex)   { return BadRequest(new { error = ex.Message }); }
        catch (Exception ex)                   { return Problem(detail: ex.Message, statusCode: 500); }
    }

    /// <summary>DELETE /api/ratings/{id} — remove your own rating.</summary>
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        var callerId = CallerId();
        if (callerId is null) return Unauthorized();
        try
        {
            await _svc.DeleteAsync(id, callerId.Value, ct);
            return NoContent();
        }
        catch (KeyNotFoundException) { return NotFound(); }
        catch (UnauthorizedAccessException) { return Forbid(); }
        catch (Exception ex) { return Problem(detail: ex.Message, statusCode: 500); }
    }
}
