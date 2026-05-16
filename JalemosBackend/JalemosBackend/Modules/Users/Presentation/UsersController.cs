// HTTP presentation layer for the Users module.
// Maps REST requests to IUsersService use cases and returns appropriate HTTP status codes.

using JalemosBackend.Modules.Users.Application;
using JalemosBackend.Modules.Users.Domain;
using Microsoft.AspNetCore.Mvc;

namespace JalemosBackend.Modules.Users.Presentation;

/// <summary>
/// Exposes CRUD endpoints for users under the /api/users route.
/// </summary>
[ApiController]
[Route("api/users")]
public sealed class UsersController : ControllerBase
{
    private readonly IUsersService _usersService;

    /// <summary>Injects the users application service.</summary>
    public UsersController(IUsersService usersService)
    {
        _usersService = usersService;
    }

    /// <summary>GET /api/users — returns all users. Should be protected by an admin policy.</summary>
    [HttpGet]
    public async Task<ActionResult<IEnumerable<User>>> GetAll(CancellationToken cancellationToken)
    {
        var users = await _usersService.GetAllAsync(cancellationToken);
        return Ok(users);
    }

    /// <summary>GET /api/users/{id} — returns a single user, or 404 if not found.</summary>
    [HttpGet("{id:guid}")]
    public async Task<ActionResult<User>> GetById(Guid id, CancellationToken cancellationToken)
    {
        var user = await _usersService.GetByIdAsync(id, cancellationToken);
        return user is null ? NotFound() : Ok(user);
    }

    /// <summary>POST /api/users — registers a new user account.</summary>
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] User user, CancellationToken cancellationToken)
    {
        await _usersService.CreateAsync(user, cancellationToken);
        return NoContent();
    }

    /// <summary>PUT /api/users/{id} — updates user profile. Route id overrides body id.</summary>
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] User user, CancellationToken cancellationToken)
    {
        // Enforce the route id so the primary key cannot be changed via the request body
        user.Id = id;
        await _usersService.UpdateAsync(user, cancellationToken);
        return NoContent();
    }

    /// <summary>DELETE /api/users/{id} — removes the specified user account.</summary>
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        await _usersService.DeleteAsync(id, cancellationToken);
        return NoContent();
    }
}
