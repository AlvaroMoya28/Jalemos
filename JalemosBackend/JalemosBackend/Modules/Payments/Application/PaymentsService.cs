using JalemosBackend.Infrastructure.Persistence;
using JalemosBackend.Modules.Payments.Application.DTOs;
using JalemosBackend.Modules.Payments.Infrastructure;
using DomainPaymentMethod = JalemosBackend.Modules.Payments.Domain.PaymentMethod;
using DomainPayment = JalemosBackend.Modules.Payments.Domain.Payment;

namespace JalemosBackend.Modules.Payments.Application;

public sealed class PaymentsService : IPaymentsService
{
    private readonly PaymentsRepository _repo;

    public PaymentsService(PaymentsRepository repo) => _repo = repo;

    // ── Payment methods ───────────────────────────────────────────────────

    public async Task<IEnumerable<PaymentMethodDto>> GetMyPaymentMethodsAsync(Guid userId, CancellationToken ct = default)
    {
        var methods = (await _repo.GetMethodsByUserAsync(userId, ct)).ToList();
        if (methods.Count == 1 && !methods[0].IsFavorite && methods[0].SimBehavior is null)
        {
            await _repo.SetFavoriteAsync(methods[0].Id, userId, ct);
            methods[0].IsFavorite = true;
        }
        return methods.Select(MapMethodToDto);
    }

    public async Task<PaymentMethodDto> AddCardAsync(CreateCardPaymentMethodDto dto, Guid userId, CancellationToken ct = default)
    {
        var cardCount = await _repo.CountActiveCardsByUserAsync(userId, ct);
        if (cardCount >= 3)
            throw new InvalidOperationException("No puedes guardar más de 3 tarjetas.");

        var digits = dto.CardNumber.Replace(" ", "").Replace("-", "");
        if (digits.Length < 13 || digits.Length > 19 || !digits.All(char.IsDigit))
            throw new InvalidOperationException("Número de tarjeta inválido.");

        if (dto.ExpiryMonth < 1 || dto.ExpiryMonth > 12)
            throw new InvalidOperationException("Mes de vencimiento inválido.");

        var currentYear = (short)DateTime.UtcNow.Year;
        var currentMonth = (short)DateTime.UtcNow.Month;
        if (dto.ExpiryYear < currentYear || (dto.ExpiryYear == currentYear && dto.ExpiryMonth < currentMonth))
            throw new InvalidOperationException("La tarjeta está vencida.");

        var last4      = digits[^4..];
        var brand      = DetectBrand(digits);
        var simBehavior = DetectSimBehavior(digits);
        var totalCount = await _repo.CountAllActiveMethodsByUserAsync(userId, ct);

        var method = new DomainPaymentMethod
        {
            UserId         = userId,
            Type           = "card",
            Alias          = dto.Alias ?? $"{brand} •••• {last4}",
            LastFourDigits = last4,
            Brand          = brand,
            ExpiryMonth    = dto.ExpiryMonth,
            ExpiryYear     = dto.ExpiryYear,
            IsFavorite     = totalCount == 0 && simBehavior is null,
            SimBehavior    = simBehavior,
            Active         = true
        };

        var created = await _repo.CreateMethodAsync(method, ct);
        return MapMethodToDto(created);
    }

    public async Task<PaymentMethodDto> AddSimpleMethodAsync(AddSimplePaymentMethodDto dto, Guid userId, CancellationToken ct = default)
    {
        var type = dto.Type.ToLower();
        if (type != "sinpe" && type != "cash")
            throw new InvalidOperationException("Tipo de método no válido. Use 'sinpe' o 'cash'.");

        var totalCount = await _repo.CountAllActiveMethodsByUserAsync(userId, ct);
        var method = new DomainPaymentMethod
        {
            UserId     = userId,
            Type       = type,
            Alias      = dto.Alias,
            IsFavorite = totalCount == 0,
            Active     = true
        };

        var created = await _repo.CreateMethodAsync(method, ct);
        return MapMethodToDto(created);
    }

    public async Task SetFavoriteAsync(Guid paymentMethodId, Guid userId, CancellationToken ct = default)
    {
        var method = await _repo.GetMethodByIdAsync(paymentMethodId, ct)
            ?? throw new KeyNotFoundException("Método de pago no encontrado.");
        if (method.UserId != userId)
            throw new UnauthorizedAccessException("No tienes permiso para modificar este método de pago.");

        await _repo.SetFavoriteAsync(paymentMethodId, userId, ct);
        await _repo.UpdateLastUsedMethodAsync(userId, paymentMethodId, ct);
    }

    public async Task DeletePaymentMethodAsync(Guid paymentMethodId, Guid userId, CancellationToken ct = default)
    {
        var method = await _repo.GetMethodByIdAsync(paymentMethodId, ct)
            ?? throw new KeyNotFoundException("Método de pago no encontrado.");
        if (method.UserId != userId)
            throw new UnauthorizedAccessException("No tienes permiso para eliminar este método de pago.");

        await _repo.SoftDeleteMethodAsync(paymentMethodId, ct);

        var remaining = (await _repo.GetMethodsByUserAsync(userId, ct)).ToList();
        if (remaining.Count == 1 && !remaining[0].IsFavorite && remaining[0].SimBehavior is null)
            await _repo.SetFavoriteAsync(remaining[0].Id, userId, ct);
    }

    public async Task<LastUsedPaymentMethodDto?> GetLastUsedMethodAsync(Guid userId, CancellationToken ct = default)
    {
        var method = await _repo.GetLastUsedMethodAsync(userId, ct);
        if (method is null) return null;

        return new LastUsedPaymentMethodDto
        {
            PaymentMethodId = method.Id,
            Type            = method.Type,
            Alias           = method.Alias,
            LastFourDigits  = method.LastFourDigits,
            Brand           = method.Brand
        };
    }

    // ── Payments ──────────────────────────────────────────────────────────

    public async Task<PaymentDto> CreatePaymentAsync(CreatePaymentDto dto, Guid callerId, CancellationToken ct = default)
    {
        var bookingPassenger = await _repo.GetBookingPassengerAsync(dto.BookingId, ct)
            ?? throw new KeyNotFoundException("Reserva no encontrada.");
        if (bookingPassenger != callerId)
            throw new UnauthorizedAccessException("No puedes pagar una reserva que no es tuya.");

        var payment = new DomainPayment
        {
            BookingId       = dto.BookingId,
            PayerId         = callerId,
            Amount          = dto.Amount,
            Method          = dto.Method.ToLower(),
            Status          = "pending",
            PaymentMethodId = dto.PaymentMethodId
        };

        if (dto.Method.Equals("card", StringComparison.OrdinalIgnoreCase))
        {
            if (dto.PaymentMethodId is null)
                throw new InvalidOperationException("Se requiere PaymentMethodId para pagos con tarjeta.");

            var method = await _repo.GetMethodByIdAsync(dto.PaymentMethodId.Value, ct)
                ?? throw new KeyNotFoundException("Tarjeta no encontrada.");
            if (method.UserId != callerId)
                throw new UnauthorizedAccessException("No tienes permiso para usar esta tarjeta.");

            payment.Status = SimulateCharge(method.SimBehavior);
        }

        var created = await _repo.CreatePaymentAsync(payment, ct);

        if (dto.PaymentMethodId.HasValue && payment.Status != "failed")
            await _repo.UpdateLastUsedMethodAsync(callerId, dto.PaymentMethodId.Value, ct);

        return MapPaymentToDto(created);
    }

    public async Task<PaymentDto> ConfirmPaymentAsync(Guid paymentId, Guid callerId, CancellationToken ct = default)
    {
        var payment = await _repo.GetPaymentByIdAsync(paymentId, ct)
            ?? throw new KeyNotFoundException("Pago no encontrado.");

        if (payment.Method == "card")
            throw new InvalidOperationException("Los pagos con tarjeta se confirman automáticamente.");
        if (payment.Status == "confirmed")
            throw new InvalidOperationException("Este pago ya fue confirmado.");

        var driverId = await _repo.GetTripDriverByBookingAsync(payment.BookingId, ct)
            ?? throw new KeyNotFoundException("Viaje no encontrado para esta reserva.");
        if (driverId != callerId)
            throw new UnauthorizedAccessException("Solo el conductor del viaje puede confirmar este pago.");

        await _repo.UpdatePaymentStatusAsync(paymentId, PaymentStatus.confirmed, ct);
        payment.Status = "confirmed";
        return MapPaymentToDto(payment);
    }

    public async Task<PaymentDto?> GetPaymentByBookingAsync(Guid bookingId, Guid callerId, CancellationToken ct = default)
    {
        var payment = await _repo.GetPaymentByBookingAsync(bookingId, ct);
        if (payment is null) return null;

        if (payment.PayerId != callerId)
        {
            var driverId = await _repo.GetTripDriverByBookingAsync(bookingId, ct);
            if (driverId != callerId)
                throw new UnauthorizedAccessException("No tienes permiso para ver este pago.");
        }

        return MapPaymentToDto(payment);
    }

    // ── Simulation helpers ────────────────────────────────────────────────

    // Magic card numbers for simulating different payment outcomes.
    // All other numbers → success.
    private static string? DetectSimBehavior(string digits) => digits switch
    {
        "4000000000000002" => "declined",
        "4000000000009995" => "insufficient_funds",
        "4000000000000069" => "expired",
        "4000000000000127" => "incorrect_cvv",
        _                  => null
    };

    private static string SimulateCharge(string? behavior) => behavior switch
    {
        "declined"           => "failed",
        "insufficient_funds" => "failed",
        "expired"            => "failed",
        "incorrect_cvv"      => "failed",
        _                    => "confirmed"
    };

    private static string DetectBrand(string digits) => digits[0] switch
    {
        '4' => "Visa",
        '5' => "Mastercard",
        '3' => "Amex",
        '6' => "Discover",
        _   => "Other"
    };

    // ── Mappers ───────────────────────────────────────────────────────────

    private static PaymentMethodDto MapMethodToDto(DomainPaymentMethod m) => new()
    {
        Id             = m.Id,
        Type           = m.Type,
        Alias          = m.Alias,
        LastFourDigits = m.LastFourDigits,
        Brand          = m.Brand,
        ExpiryMonth    = m.ExpiryMonth,
        ExpiryYear     = m.ExpiryYear,
        IsFavorite     = m.IsFavorite,
        SimBehavior    = m.SimBehavior,
        CreatedAt      = m.CreatedAt
    };

    private static PaymentDto MapPaymentToDto(DomainPayment p) => new()
    {
        Id              = p.Id,
        BookingId       = p.BookingId,
        Amount          = p.Amount,
        Method          = p.Method,
        Status          = p.Status,
        PaymentMethodId = p.PaymentMethodId,
        CreatedAt       = p.CreatedAt,
        UpdatedAt       = p.UpdatedAt
    };
}
