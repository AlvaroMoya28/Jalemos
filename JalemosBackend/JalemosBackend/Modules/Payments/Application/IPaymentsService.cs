using JalemosBackend.Modules.Payments.Application.DTOs;

namespace JalemosBackend.Modules.Payments.Application;

public interface IPaymentsService
{
    // ── Payment methods (cards, sinpe, cash) ──────────────────────────────
    Task<IEnumerable<PaymentMethodDto>> GetMyPaymentMethodsAsync(Guid userId, CancellationToken ct = default);
    Task<PaymentMethodDto> AddCardAsync(CreateCardPaymentMethodDto dto, Guid userId, CancellationToken ct = default);
    Task<PaymentMethodDto> AddSimpleMethodAsync(AddSimplePaymentMethodDto dto, Guid userId, CancellationToken ct = default);
    Task SetFavoriteAsync(Guid paymentMethodId, Guid userId, CancellationToken ct = default);
    Task DeletePaymentMethodAsync(Guid paymentMethodId, Guid userId, CancellationToken ct = default);
    Task<LastUsedPaymentMethodDto?> GetLastUsedMethodAsync(Guid userId, CancellationToken ct = default);

    // ── Per-booking payments ──────────────────────────────────────────────
    Task<PaymentDto> CreatePaymentAsync(CreatePaymentDto dto, Guid callerId, CancellationToken ct = default);
    Task<PaymentDto> ConfirmPaymentAsync(Guid paymentId, Guid callerId, CancellationToken ct = default);
    Task<PaymentDto?> GetPaymentByBookingAsync(Guid bookingId, Guid callerId, CancellationToken ct = default);
}
