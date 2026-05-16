// HTTP presentation layer for the Ratings module.
// Maps REST requests to IRatingsService use cases and returns appropriate HTTP responses.

using JalemosBackend.Modules.Ratings.Application;
using JalemosBackend.Modules.Ratings.Domain;
using Microsoft.AspNetCore.Mvc;

namespace JalemosBackend.Modules.Ratings.Presentation;

/// <summary>
/// Exposes CRUD endpoints for ratings under the /api/ratings route.
/// </summary>
[ApiController]
[Route("api/ratings")]
public sealed class RatingsController : ControllerBase
{
    private readonly IRatingsService _ratingsService;

    /// <summary>Injects the ratings application service.</summary>
    public RatingsController(IRatingsService ratingsService)
    {
        _ratingsService = ratingsService;
    }

    /// <summary>GET /api/ratings — retrieves all ratings.</summary>
    [HttpGet]
    public async Task<ActionResult<IEnumerable<Rating>>> GetAll(CancellationToken cancellationToken)
    {
        var ratings = await _ratingsService.GetAllAsync(cancellationToken);
        return Ok(ratings);
    }

    /// <summary>GET /api/ratings/{id} — returns a single rating. 404 if not found.</summary>
    [HttpGet("{id:guid}")]
    public async Task<ActionResult<Rating>> GetById(Guid id, CancellationToken cancellationToken)
    {
        var rating = await _ratingsService.GetByIdAsync(id, cancellationToken);
        return rating is null ? NotFound() : Ok(rating);
    }

    /// <summary>POST /api/ratings — submits a new rating for a completed trip.</summary>
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] Rating rating, CancellationToken cancellationToken)
    {
        await _ratingsService.CreateAsync(rating, cancellationToken);
        return NoContent();
    }

    /// <summary>PUT /api/ratings/{id} — updates an existing rating. Route id overrides body id.</summary>
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] Rating rating, CancellationToken cancellationToken)
    {
        // Enforce the route id so the primary key cannot be changed via the request body
        rating.Id = id;
        await _ratingsService.UpdateAsync(rating, cancellationToken);
        return NoContent();
    }

    /// <summary>DELETE /api/ratings/{id} — removes the specified rating.</summary>
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        await _ratingsService.DeleteAsync(id, cancellationToken);
        return NoContent();
    }
}
