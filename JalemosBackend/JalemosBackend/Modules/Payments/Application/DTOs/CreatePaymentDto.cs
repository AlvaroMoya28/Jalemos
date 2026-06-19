namespace JalemosBackend.Modules.Payments.Application.DTOs;

public class CreatePaymentDto
{
    public Guid BookingId { get; set; }
    public decimal Amount { get; set; }
    /// <summary>"card" | "sinpe" | "cash"</summary>
    public string Method { get; set; } = null!;
    /// <summary>Required when Method is "card".</summary>
    public Guid? PaymentMethodId { get; set; }
}
