namespace JalemosBackend.Modules.Payments.Application.DTOs;

public class AddSimplePaymentMethodDto
{
    /// <summary>"sinpe" or "cash"</summary>
    public string Type { get; set; } = null!;
    public string Alias { get; set; } = null!;
}
