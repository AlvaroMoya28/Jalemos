// Este archivo actúa como fachada de entrada para el monolito modular.
// Aquí deberían exponerse rutas de orquestación, health checks o endpoints de agregación transversal.

using Microsoft.AspNetCore.Mvc;

namespace JalemosBackend.Controllers;

[ApiController]
[Route("api/gateway")]
public sealed class ApiGatewayController : ControllerBase
{
    // TODO: este endpoint debería ofrecer información general del backend o enrutar a vistas agregadas.
    [HttpGet]
    public IActionResult Get()
    {
        return Ok(new
        {
            Message = "JalemosBackend gateway operativo",
            Modules = new[] { "Rides", "Users", "Notifications", "Bookings", "Ratings" }
        });
    }
}
