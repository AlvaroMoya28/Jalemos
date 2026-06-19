namespace JalemosBackend.Modules.Payments.Application.DTOs;

public class PaymentDto
{
    public Guid Id { get; set; }
    public Guid BookingId { get; set; }
    public decimal Amount { get; set; }
    public string Method { get; set; } = null!;
    public string Status { get; set; } = null!;
    public Guid? PaymentMethodId { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
