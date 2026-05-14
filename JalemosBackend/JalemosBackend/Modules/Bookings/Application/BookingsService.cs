// Este archivo contiene la lógica de aplicación del módulo Bookings.
// Aquí deberían coordinarse validaciones y reglas del negocio de reservas.

using JalemosBackend.Modules.Bookings.Domain;
using JalemosBackend.Modules.Bookings.Infrastructure;

namespace JalemosBackend.Modules.Bookings.Application;

public sealed class BookingsService : IBookingsService
{
    private readonly BookingsRepository _repository;

    public BookingsService(BookingsRepository repository)
    {
        _repository = repository;
    }

    public Task<IEnumerable<Booking>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return _repository.GetAllAsync(cancellationToken);
    }

    public Task<Booking?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return _repository.GetByIdAsync(id, cancellationToken);
    }

    public Task CreateAsync(Booking booking, CancellationToken cancellationToken = default)
    {
        return _repository.CreateAsync(booking, cancellationToken);
    }

    public Task UpdateAsync(Booking booking, CancellationToken cancellationToken = default)
    {
        return _repository.UpdateAsync(booking, cancellationToken);
    }

    public Task DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return _repository.DeleteAsync(id, cancellationToken);
    }
}
