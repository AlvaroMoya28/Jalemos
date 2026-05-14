// Este archivo expone los endpoints HTTP del módulo Ratings.
// Aquí debería traducirse la API REST a casos de uso de aplicación.

using JalemosBackend.Modules.Ratings.Application;
using JalemosBackend.Modules.Ratings.Domain;
using Microsoft.AspNetCore.Mvc;

namespace JalemosBackend.Modules.Ratings.Presentation;

[ApiController]
[Route("api/ratings")]
public sealed class RatingsController : ControllerBase
{
    private readonly IRatingsService _ratingsService;

    public RatingsController(IRatingsService ratingsService)
    {
        _ratingsService = ratingsService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Rating>>> GetAll(CancellationToken cancellationToken)
    {
        var ratings = await _ratingsService.GetAllAsync(cancellationToken);
        return Ok(ratings);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<Rating>> GetById(Guid id, CancellationToken cancellationToken)
    {
        var rating = await _ratingsService.GetByIdAsync(id, cancellationToken);
        return rating is null ? NotFound() : Ok(rating);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] Rating rating, CancellationToken cancellationToken)
    {
        await _ratingsService.CreateAsync(rating, cancellationToken);
        return NoContent();
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] Rating rating, CancellationToken cancellationToken)
    {
        rating.Id = id;
        await _ratingsService.UpdateAsync(rating, cancellationToken);
        return NoContent();
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        await _ratingsService.DeleteAsync(id, cancellationToken);
        return NoContent();
    }
}
