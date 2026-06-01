// Entry facade for the modular monolith.
// Exposes cross-cutting endpoints such as health checks, API version info,
// and module availability — useful for load balancer probes and client discovery.

using Microsoft.AspNetCore.Mvc;

namespace JalemosBackend.Controllers;

/// <summary>
/// API gateway controller — provides general metadata about the backend
/// and can be extended to aggregate responses from multiple modules.
/// </summary>
[ApiController]
[Route("api/gateway")]
public sealed class ApiGatewayController : ControllerBase
{
    /// <summary>
    /// Returns a status message and the list of active feature modules.
    /// Useful as a lightweight health-check endpoint.
    /// </summary>
    [HttpGet]
    public IActionResult Get()
    {
        // Return a simple object so clients can verify connectivity and discover modules
        return Ok(new
        {
            Message = "JalemosBackend gateway operativo",
            Modules = new[] { "Trips", "Users", "Notifications", "Bookings", "Ratings" }
        });
    }
}
