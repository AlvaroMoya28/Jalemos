using JalemosBackend.Infrastructure.Persistence;

namespace JalemosBackend.Modules.Payments.Infrastructure;

public class PaymentEntity
{
    public Guid PaymentId { get; set; }
    public Guid BookingId { get; set; }
    public Guid PayerId { get; set; }
    public decimal Amount { get; set; }
    public PaymentType Method { get; set; }
    public PaymentStatus Status { get; set; }
    public string? StripePaymentIntentId { get; set; }
    public Guid? PaymentMethodId { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
