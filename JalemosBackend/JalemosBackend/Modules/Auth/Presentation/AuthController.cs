using Microsoft.AspNetCore.Mvc;
using JalemosBackend.Modules.Auth.Application;
using JalemosBackend.Modules.Auth.Application.DTOs;

namespace JalemosBackend.Modules.Auth.Presentation
{
    [ApiController]
    [Route("api/auth")]
    public sealed class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;

        public AuthController(IAuthService authService) => _authService = authService;

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequestDto dto, CancellationToken ct)
        {
            var result = await _authService.LoginAsync(dto.Identifier, dto.Password, ct);
            if (result is null)
                return Unauthorized(new { error = "Usuario o contraseña incorrectos" });
            return Ok(result);
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterRequestDto dto, CancellationToken ct)
        {
            try
            {
                var result = await _authService.RegisterAsync(dto, ct);
                return Created($"/api/users/{result.Id}", result);
            }
            catch (InvalidOperationException ex)
            {
                return Conflict(new { error = ex.Message });
            }
        }
    }
}
