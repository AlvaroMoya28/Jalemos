using Microsoft.EntityFrameworkCore;
using JalemosBackend.Infrastructure.Persistence;
using JalemosBackend.Modules.Payments.Domain;

namespace JalemosBackend.Modules.Payments.Infrastructure;

public sealed class PaymentsRepository
{
    private readonly ApplicationDbContext _db;

    public PaymentsRepository(ApplicationDbContext db) => _db = db;

    // ── Payment methods ───────────────────────────────────────────────────

    public async Task<IEnumerable<PaymentMethod>> GetMethodsByUserAsync(Guid userId, CancellationToken ct = default)
    {
        var rows = await _db.PaymentMethods
            .AsNoTracking()
            .Where(m => m.UserId == userId && m.Active)
            .OrderByDescending(m => m.IsFavorite)
            .ThenBy(m => m.CreatedAt)
            .ToListAsync(ct);
        return rows.Select(MapMethodToDomain);
    }

    public async Task<int> CountActiveCardsByUserAsync(Guid userId, CancellationToken ct = default) =>
        await _db.PaymentMethods.CountAsync(
            m => m.UserId == userId && m.Active && m.Type == PaymentType.Card, ct);

    public async Task<int> CountAllActiveMethodsByUserAsync(Guid userId, CancellationToken ct = default) =>
        await _db.PaymentMethods.CountAsync(m => m.UserId == userId && m.Active, ct);

    public async Task<PaymentMethod> CreateMethodAsync(PaymentMethod method, CancellationToken ct = default)
    {
        var entity = MapMethodToEntity(method);
        _db.PaymentMethods.Add(entity);
        await _db.SaveChangesAsync(ct);
        method.Id = entity.PaymentId;
        return method;
    }

    public async Task<PaymentMethod?> GetMethodByIdAsync(Guid id, CancellationToken ct = default)
    {
        var e = await _db.PaymentMethods.AsNoTracking().FirstOrDefaultAsync(m => m.PaymentId == id, ct);
        return e is null ? null : MapMethodToDomain(e);
    }

    public async Task SetFavoriteAsync(Guid methodId, Guid userId, CancellationToken ct = default)
    {
        await using var tx = await _db.Database.BeginTransactionAsync(ct);

        // Clear existing favorites for this user.
        var all = await _db.PaymentMethods.Where(m => m.UserId == userId && m.Active).ToListAsync(ct);
        foreach (var m in all) m.IsFavorite = false;

        var target = all.FirstOrDefault(m => m.PaymentId == methodId)
            ?? throw new KeyNotFoundException("Método de pago no encontrado.");
        target.IsFavorite = true;

        await _db.SaveChangesAsync(ct);
        await tx.CommitAsync(ct);
    }

    public async Task SoftDeleteMethodAsync(Guid methodId, CancellationToken ct = default)
    {
        var entity = await _db.PaymentMethods.FirstOrDefaultAsync(m => m.PaymentId == methodId, ct)
            ?? throw new KeyNotFoundException("Método de pago no encontrado.");
        entity.Active = false;
        await _db.SaveChangesAsync(ct);
    }

    // ── User stripe info ──────────────────────────────────────────────────

    public async Task<(string? StripeCustomerId, Guid? LastUsedMethodId)> GetUserPaymentInfoAsync(Guid userId, CancellationToken ct = default)
    {
        var user = await _db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.UserId == userId, ct)
            ?? throw new KeyNotFoundException("Usuario no encontrado.");
        return (user.StripeCustomerId, user.LastUsedPaymentMethodId);
    }

    public async Task UpdateUserStripeCustomerIdAsync(Guid userId, string stripeCustomerId, CancellationToken ct = default)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.UserId == userId, ct)
            ?? throw new KeyNotFoundException("Usuario no encontrado.");
        user.StripeCustomerId = stripeCustomerId;
        await _db.SaveChangesAsync(ct);
    }

    public async Task UpdateLastUsedMethodAsync(Guid userId, Guid methodId, CancellationToken ct = default)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.UserId == userId, ct)
            ?? throw new KeyNotFoundException("Usuario no encontrado.");
        user.LastUsedPaymentMethodId = methodId;
        await _db.SaveChangesAsync(ct);
    }

    public async Task<PaymentMethod?> GetLastUsedMethodAsync(Guid userId, CancellationToken ct = default)
    {
        var user = await _db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.UserId == userId, ct);
        if (user?.LastUsedPaymentMethodId is null) return null;

        var e = await _db.PaymentMethods.AsNoTracking()
            .FirstOrDefaultAsync(m => m.PaymentId == user.LastUsedPaymentMethodId && m.Active, ct);
        return e is null ? null : MapMethodToDomain(e);
    }

    // ── Payments ──────────────────────────────────────────────────────────

    public async Task<Payment> CreatePaymentAsync(Payment payment, CancellationToken ct = default)
    {
        var entity = MapPaymentToEntity(payment);
        _db.Payments.Add(entity);
        await _db.SaveChangesAsync(ct);
        payment.Id = entity.PaymentId;
        return payment;
    }

    public async Task<Payment?> GetPaymentByIdAsync(Guid id, CancellationToken ct = default)
    {
        var e = await _db.Payments.AsNoTracking().FirstOrDefaultAsync(p => p.PaymentId == id, ct);
        return e is null ? null : MapPaymentToDomain(e);
    }

    public async Task<Payment?> GetPaymentByBookingAsync(Guid bookingId, CancellationToken ct = default)
    {
        var e = await _db.Payments.AsNoTracking().FirstOrDefaultAsync(p => p.BookingId == bookingId, ct);
        return e is null ? null : MapPaymentToDomain(e);
    }

    public async Task UpdatePaymentStatusAsync(Guid paymentId, PaymentStatus status, string? stripeIntentId, CancellationToken ct = default)
    {
        var entity = await _db.Payments.FirstOrDefaultAsync(p => p.PaymentId == paymentId, ct)
            ?? throw new KeyNotFoundException("Pago no encontrado.");
        entity.Status = status;
        if (stripeIntentId is not null) entity.StripePaymentIntentId = stripeIntentId;
        entity.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
    }

    // ── Booking / trip ownership helpers ─────────────────────────────────

    public async Task<Guid?> GetBookingPassengerAsync(Guid bookingId, CancellationToken ct = default)
    {
        var booking = await _db.Bookings.AsNoTracking().FirstOrDefaultAsync(b => b.BookingId == bookingId, ct);
        return booking?.PassengerId;
    }

    public async Task<Guid?> GetTripDriverByBookingAsync(Guid bookingId, CancellationToken ct = default)
    {
        var booking = await _db.Bookings.AsNoTracking().FirstOrDefaultAsync(b => b.BookingId == bookingId, ct);
        if (booking is null) return null;

        var trip = await _db.Trips.AsNoTracking().FirstOrDefaultAsync(t => t.TripId == booking.TripId, ct);
        return trip?.DriverUserId;
    }

    // ── Mappers ───────────────────────────────────────────────────────────

    private static PaymentMethod MapMethodToDomain(PaymentMethodEntity e) => new()
    {
        Id = e.PaymentId,
        UserId = e.UserId,
        Type = e.Type.ToString().ToLower(),
        Alias = e.Alias,
        LastFourDigits = e.LastFourDigits,
        Brand = e.Brand,
        ExpiryMonth = e.ExpiryMonth,
        ExpiryYear = e.ExpiryYear,
        IsFavorite = e.IsFavorite,
        StripePaymentMethodId = e.StripePaymentMethodId,
        Active = e.Active,
        CreatedAt = e.CreatedAt
    };

    private static PaymentMethodEntity MapMethodToEntity(PaymentMethod d) => new()
    {
        PaymentId = d.Id == Guid.Empty ? Guid.NewGuid() : d.Id,
        UserId = d.UserId,
        Type = Enum.Parse<PaymentType>(d.Type, ignoreCase: true),
        Alias = d.Alias,
        LastFourDigits = d.LastFourDigits,
        Brand = d.Brand,
        ExpiryMonth = d.ExpiryMonth,
        ExpiryYear = d.ExpiryYear,
        IsFavorite = d.IsFavorite,
        StripePaymentMethodId = d.StripePaymentMethodId,
        Active = d.Active,
        CreatedAt = d.CreatedAt == default ? DateTime.UtcNow : d.CreatedAt
    };

    private static Payment MapPaymentToDomain(PaymentEntity e) => new()
    {
        Id = e.PaymentId,
        BookingId = e.BookingId,
        PayerId = e.PayerId,
        Amount = e.Amount,
        Method = e.Method.ToString().ToLower(),
        Status = e.Status.ToString().ToLower(),
        StripePaymentIntentId = e.StripePaymentIntentId,
        PaymentMethodId = e.PaymentMethodId,
        CreatedAt = e.CreatedAt,
        UpdatedAt = e.UpdatedAt
    };

    private static PaymentEntity MapPaymentToEntity(Payment d) => new()
    {
        PaymentId = d.Id == Guid.Empty ? Guid.NewGuid() : d.Id,
        BookingId = d.BookingId,
        PayerId = d.PayerId,
        Amount = d.Amount,
        Method = Enum.Parse<PaymentType>(d.Method, ignoreCase: true),
        Status = Enum.Parse<PaymentStatus>(d.Status, ignoreCase: true),
        StripePaymentIntentId = d.StripePaymentIntentId,
        PaymentMethodId = d.PaymentMethodId,
        CreatedAt = d.CreatedAt == default ? DateTime.UtcNow : d.CreatedAt,
        UpdatedAt = d.UpdatedAt == default ? DateTime.UtcNow : d.UpdatedAt
    };
}
