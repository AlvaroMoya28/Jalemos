// Data access layer for the Bookings module.
// Translates domain operations into database queries against the shared ApplicationDbContext.
// No business logic belongs here — only raw CRUD operations.

using Microsoft.EntityFrameworkCore;
using JalemosBackend.Infrastructure.Persistence;
using JalemosBackend.Modules.Bookings.Domain;

namespace JalemosBackend.Modules.Bookings.Infrastructure;

/// <summary>
/// Provides persistence operations for <see cref="Booking"/> entities.
/// Implements transactional seat reservation logic to avoid overbooking.
/// </summary>
public sealed class BookingsRepository
{
    private readonly ApplicationDbContext _dbContext;

    /// <summary>Receives the shared database context via constructor injection.</summary>
    public BookingsRepository(ApplicationDbContext dbContext)
    {
        _dbContext = dbContext;
    }

        /// <summary>Maps a domain entity to a database entity.</summary>
        public static Booking MapToDomain(BookingEntity e) => new Booking
        {
            Id = e.BookingId,
            TripId = e.TripId,
            PassengerId = e.PassengerId,
            SeatsReserved = e.SeatsReserved,
            EstimatedAmount = e.EstimatedAmount,
            State = e.State,
            CreatedAt = e.CreatedAt,
            UpdatedAt = e.UpdatedAt
        };

        /// <summary>Maps a database entity to a domain entity.</summary>
        public static BookingEntity MapToEntity(Booking d) => new BookingEntity
        {
            BookingId = d.Id == Guid.Empty ? Guid.NewGuid() : d.Id,
            TripId = d.TripId,
            PassengerId = d.PassengerId,
            SeatsReserved = d.SeatsReserved,
            EstimatedAmount = d.EstimatedAmount,
            State = d.State,
            CreatedAt = d.CreatedAt == default ? DateTime.UtcNow : d.CreatedAt,
            UpdatedAt = d.UpdatedAt == default ? DateTime.UtcNow : d.UpdatedAt
        };

    /// <summary>Returns all bookings.</summary>
    public async Task<IEnumerable<Booking>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        var rows = await _dbContext.Bookings.AsNoTracking().ToListAsync(cancellationToken);
        return rows.Select(MapToDomain).ToList();
    }

    /// <summary>Finds a booking by primary key. Returns null if no match is found.</summary>
    public async Task<Booking?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var r = await _dbContext.Bookings.AsNoTracking().FirstOrDefaultAsync(x => x.BookingId == id, cancellationToken);
        return r is null ? null : MapToDomain(r);
    }

    /// <summary>Inserts a new booking record into the database using a DB transaction and updates trip seats atomically.</summary>
    public async Task CreateAsync(Booking booking, CancellationToken cancellationToken = default)
    {
        // Use a transaction to ensure we don't oversell seats under concurrency
        await using var tx = await _dbContext.Database.BeginTransactionAsync(cancellationToken);

        // Reload trip with locking behaviour; EF Core + Postgres will escalate via transaction
        var trip = await _dbContext.Trips.FirstOrDefaultAsync(t => t.TripId == booking.TripId, cancellationToken);
        if (trip is null) throw new InvalidOperationException("Trip not found");

        if (trip.AvailableSeats < booking.SeatsReserved)
            throw new InvalidOperationException("No hay suficientes espacios disponibles para este viaje.");

        // Prevent duplicate booking by same passenger for same trip
        var exists = await _dbContext.Bookings.AnyAsync(b => b.TripId == booking.TripId && b.PassengerId == booking.PassengerId && b.State != BookingState.Cancelled, cancellationToken);
        if (exists) throw new InvalidOperationException("Ya existe una reserva para este usuario en ese viaje.");

        // Decrement available seats and insert booking
        trip.AvailableSeats = (short)(trip.AvailableSeats - booking.SeatsReserved);

        // Map domain to entity and save changes atomically
        var entity = MapToEntity(booking);
        _dbContext.Bookings.Add(entity);
        await _dbContext.SaveChangesAsync(cancellationToken);
        await tx.CommitAsync(cancellationToken);

        // Populate id back to domain object, used for returning the created booking with its new id
        booking.Id = entity.BookingId;
    }

    /// <summary>Updates an existing booking record. Adjusts trip available seats if the reserved seats change.</summary>
    public async Task UpdateAsync(Booking booking, CancellationToken cancellationToken = default)
    {
        // Use a transaction to ensure not to oversell seats under concurrency when updating the number of reserved seats
        await using var tx = await _dbContext.Database.BeginTransactionAsync(cancellationToken);

        var entity = await _dbContext.Bookings.FirstOrDefaultAsync(b => b.BookingId == booking.Id, cancellationToken);
        if (entity is null) throw new InvalidOperationException("Booking not found");

        var trip = await _dbContext.Trips.FirstOrDefaultAsync(t => t.TripId == entity.TripId, cancellationToken);
        if (trip is null) throw new InvalidOperationException("Trip not found for booking");

        // If seatsReserved changed, adjust trip.AvailableSeats accordingly
        var delta = booking.SeatsReserved - entity.SeatsReserved;
        if (delta > 0 && trip.AvailableSeats < delta)
            throw new InvalidOperationException("No hay suficientes espacios disponibles para aumentar la reserva.");

        trip.AvailableSeats = (short)(trip.AvailableSeats - delta);

        // Update booking fields
        entity.SeatsReserved = booking.SeatsReserved;
        entity.EstimatedAmount = booking.EstimatedAmount;
        entity.State = booking.State;
        entity.UpdatedAt = DateTime.UtcNow;

        // Save changes to both booking and trip atomically
        await _dbContext.SaveChangesAsync(cancellationToken);
        await tx.CommitAsync(cancellationToken);
    }

    /// <summary>Removes the booking with the given identifier from the database and releases reserved seats back to the trip.</summary>
    public async Task DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        // Use a transaction to ensure we don't leave the system in an inconsistent state 
        await using var tx = await _dbContext.Database.BeginTransactionAsync(cancellationToken);

        // Find the booking to delete
        var entity = await _dbContext.Bookings.FirstOrDefaultAsync(b => b.BookingId == id, cancellationToken);
        if (entity is null) return;

        // Find the associated trip to release the seats back
        var trip = await _dbContext.Trips.FirstOrDefaultAsync(t => t.TripId == entity.TripId, cancellationToken);
        if (trip is not null)
        {
            trip.AvailableSeats = (short)(trip.AvailableSeats + entity.SeatsReserved);
        }

        // Remove the booking and save changes atomically
        _dbContext.Bookings.Remove(entity);
        await _dbContext.SaveChangesAsync(cancellationToken);
        await tx.CommitAsync(cancellationToken);
    }
}
