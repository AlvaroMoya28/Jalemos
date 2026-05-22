// HTTP presentation layer for the Users module.
// Maps REST requests to IUsersService use cases and returns appropriate HTTP status codes.

using JalemosBackend.Modules.Users.Application;
using JalemosBackend.Modules.Users.Domain;
using Microsoft.AspNetCore.Mvc;

namespace JalemosBackend.Modules.Users.Presentation;

// Controller for user-related endpoints, e.g. to manage user profiles and retrieve user information. 
[ApiController]
[Route("api/users")]
public sealed class UsersController : ControllerBase
{
    private readonly IUsersService _usersService;

    public UsersController(IUsersService usersService)
    {
        _usersService = usersService;
    }

    // Get that returns a list of all users.
    // TODO: Should be protected by an admin policy so only admins can access the full list of users.
    [HttpGet]
    public async Task<ActionResult<IEnumerable<User>>> GetAll(CancellationToken cancellationToken)
    {
        try
        {
            var users = await _usersService.GetAllAsync(cancellationToken);
            return Ok(users);
        }
        catch (Exception ex)
        {
            return Problem(detail: ex.ToString(), statusCode: 500);
        }
    }

    // Get that returns a single user by id, or 404 if not found.
    // TODO: Should be protected by an auth policy so users can only access their own profile (or admins can access any profile).
    [HttpGet("{id:guid}")]
    public async Task<ActionResult<User>> GetById(Guid id, CancellationToken cancellationToken)
    {
        var user = await _usersService.GetByIdAsync(id, cancellationToken);
        return user is null ? NotFound() : Ok(user);
    }

    // Post that creates a new user. The request body should contain the user profile data, including a plaintext password that will be hashed in the service layer.
    // TODO: this endpoint should be protected by an admin policy, or we need to implement a public registration flow with email verification and password hashing here in the controller instead of the service layer.
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] User user, CancellationToken cancellationToken)
    {
        await _usersService.CreateAsync(user, cancellationToken);
        return NoContent();
    }

    // Put that updates an existing user. 
    // TODO: Should be protected by an auth policy so users can only update their own profile (or admins can update any profile).
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] User user, CancellationToken cancellationToken)
    {
        // Enforce the route id so the primary key cannot be changed via the request body
        user.Id = id;
        await _usersService.UpdateAsync(user, cancellationToken);
        return NoContent();
    }

    // Delete that removes a user by id.
    // TODO: Should be protected by an auth policy so users can only delete their own account (or admins can delete any account).
    // TODO: We should also consider whether to implement soft deletes here instead of hard deletes in the repository layer.
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        await _usersService.DeleteAsync(id, cancellationToken);
        return NoContent();
    }
}
