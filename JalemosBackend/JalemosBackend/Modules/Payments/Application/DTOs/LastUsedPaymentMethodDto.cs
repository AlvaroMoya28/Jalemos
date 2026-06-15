namespace JalemosBackend.Modules.Payments.Application.DTOs;

public class LastUsedPaymentMethodDto
{
    public Guid? PaymentMethodId { get; set; }
    public string? Type { get; set; }
    public string? Alias { get; set; }
    public string? LastFourDigits { get; set; }
    public string? Brand { get; set; }
}
