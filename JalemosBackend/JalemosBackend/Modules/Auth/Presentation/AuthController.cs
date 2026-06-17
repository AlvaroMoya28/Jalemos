using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
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
            try
            {
                var result = await _authService.LoginAsync(dto.Identifier, dto.Password, ct);
                if (result is null)
                    return Unauthorized(new { error = "Usuario o contraseña incorrectos" });
                return Ok(result);
            }
            catch (AccountBlockedException ex)
            {
                var message = ex.IsDeactivated
                    ? "Tu cuenta fue desactivada. Contactá al equipo de soporte."
                    : $"Tu cuenta está suspendida hasta el {ex.SuspendedUntil!.Value.ToLocalTime():dd/MM/yyyy 'a las' HH:mm}.";
                return StatusCode(403, new { error = message });
            }
            catch (InvalidOperationException ex)
            {
                return Conflict(new { error = ex.Message });
            }
        }

        // Returns 202 Accepted with { userId, email, expiresAt } — the user must verify their email before logging in.
        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterRequestDto dto, CancellationToken ct)
        {
            try
            {
                var result = await _authService.RegisterAsync(dto, ct);
                return Accepted(new { userId = result.UserId, email = result.Email, expiresAt = result.ExpiresAt });
            }
            catch (InvalidOperationException ex)
            {
                return Conflict(new { error = ex.Message });
            }
        }

        // POST /api/auth/verify-email — validates the 6-digit code and returns a JWT on success.
        [HttpPost("verify-email")]
        public async Task<IActionResult> VerifyEmail([FromBody] VerifyEmailRequestDto dto, CancellationToken ct)
        {
            try
            {
                var result = await _authService.VerifyEmailAsync(dto, ct);
                return Ok(result);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { error = ex.Message });
            }
            catch (UnauthorizedAccessException ex)
            {
                return BadRequest(new { error = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        // GET /api/auth/refresh — devuelve un JWT nuevo con los datos más recientes del usuario.
        // Se llama cuando el admin aprueba la solicitud de conductor y el usuario necesita un token con role=driver.
        [HttpGet("refresh")]
        [Authorize]
        public async Task<IActionResult> Refresh(CancellationToken ct)
        {
            try
            {
                var sub = User.FindFirstValue(JwtRegisteredClaimNames.Sub)
                       ?? User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (sub is null || !Guid.TryParse(sub, out var userId))
                    return Unauthorized(new { error = "Token inválido" });

                var result = await _authService.RefreshAsync(userId, ct);
                return result is null ? NotFound(new { error = "Usuario no encontrado" }) : Ok(result);
            }
            catch (AccountBlockedException ex)
            {
                var message = ex.IsDeactivated
                    ? "Tu cuenta fue desactivada. Contactá al equipo de soporte."
                    : $"Tu cuenta está suspendida hasta el {ex.SuspendedUntil!.Value.ToLocalTime():dd/MM/yyyy 'a las' HH:mm}.";
                return StatusCode(403, new { error = message });
            }
        }
    }
}
