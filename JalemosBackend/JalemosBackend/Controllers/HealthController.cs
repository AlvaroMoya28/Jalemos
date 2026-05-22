// Controller for health checks, e.g. to verify database connectivity.
// It is not part of the App.
using Microsoft.AspNetCore.Mvc;
using JalemosBackend.Infrastructure.Persistence;

namespace JalemosBackend.Modules.Health.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class HealthController : ControllerBase
    {
        private readonly ApplicationDbContext _db;
        public HealthController(ApplicationDbContext db) => _db = db;

        [HttpGet]
        public IActionResult Get()
        {
            var canConnect = _db.Database.CanConnect();
            int usersCount = 0;
            if (canConnect)
            {
                try { usersCount = _db.Users.Count(); }
                catch { /* ignore read errors here */ }
            }
            return Ok(new { database = canConnect, users = usersCount });
        }
    }
}