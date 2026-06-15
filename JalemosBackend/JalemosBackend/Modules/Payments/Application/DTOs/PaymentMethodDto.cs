namespace JalemosBackend.Modules.Payments.Application.DTOs;

public class PaymentMethodDto
{
    public Guid Id { get; set; }
    public string Type { get; set; } = null!;
    public string Alias { get; set; } = null!;
    public string? LastFourDigits { get; set; }
    public string? Brand { get; set; }
    public short? ExpiryMonth { get; set; }
    public short? ExpiryYear { get; set; }
    public bool IsFavorite { get; set; }
    public DateTime CreatedAt { get; set; }
}
