namespace JalemosBackend.Modules.Payments.Application.DTOs;

public class CreateCardPaymentMethodDto
{
    public string StripePaymentMethodId { get; set; } = null!;
    public string? Alias { get; set; }
}
