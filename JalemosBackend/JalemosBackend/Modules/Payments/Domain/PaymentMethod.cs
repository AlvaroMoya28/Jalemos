namespace JalemosBackend.Modules.Payments.Domain;

public class PaymentMethod
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string Type { get; set; } = null!;
    public string Alias { get; set; } = null!;
    public string? LastFourDigits { get; set; }
    public string? Brand { get; set; }
    public short? ExpiryMonth { get; set; }
    public short? ExpiryYear { get; set; }
    public bool IsFavorite { get; set; }
    public string? StripePaymentMethodId { get; set; }
    public bool Active { get; set; }
    public DateTime CreatedAt { get; set; }
}
