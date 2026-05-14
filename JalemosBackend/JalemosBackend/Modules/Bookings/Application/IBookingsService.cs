// Este archivo define el contrato de aplicación del módulo Bookings.
// Aquí deberían declararse los casos de uso de reservas.

using JalemosBackend.Modules.Bookings.Domain;

namespace JalemosBackend.Modules.Bookings.Application;

public interface IBookingsService
{
    // TODO: agregar casos de uso reales para reservas.
    Task<IEnumerable<Booking>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<Booking?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task CreateAsync(Booking booking, CancellationToken cancellationToken = default);
    Task UpdateAsync(Booking booking, CancellationToken cancellationToken = default);
    Task DeleteAsync(Guid id, CancellationToken cancellationToken = default);
}
