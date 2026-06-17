namespace JalemosBackend.Modules.Email
{
    public interface IEmailService
    {
        Task SendVerificationCodeAsync(string toEmail, string firstName, string code, CancellationToken ct = default);
    }
}
