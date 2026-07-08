namespace JalemosBackend.Modules.Payments.Application.DTOs;

public class CreateCardPaymentMethodDto
{
    public string CardNumber { get; set; } = null!;
    public short ExpiryMonth { get; set; }
    public short ExpiryYear { get; set; }
    public string CardholderName { get; set; } = null!;
    public string? Alias { get; set; }
}
