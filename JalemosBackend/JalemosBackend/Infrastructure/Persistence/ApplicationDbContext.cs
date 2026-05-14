// Este archivo representa el punto único de acceso a datos compartido por todos los módulos.
// Aquí debería vivir el DbContext real, los DbSet y la configuración de la base de datos común.

namespace JalemosBackend.Infrastructure.Persistence;

public sealed class ApplicationDbContext
{
    // TODO: reemplazar por EF Core o el proveedor de datos elegido.
    // En esta base se centralizarán las tablas de Rides, Users, Notifications, Bookings y Ratings.
}
