namespace JalemosBackend.Modules.Email
{
    public interface IEmailService
    {
        Task SendVerificationCodeAsync(string toEmail, string firstName, string code, CancellationToken ct = default);

        // Welcome email sent right after the account is verified. Embeds the user's boarding
        // QR (qrData is encoded into the image) as an inline attachment.
        Task SendWelcomeWithQrAsync(string toEmail, string firstName, string qrData, CancellationToken ct = default);

        // On-demand "email me my boarding QR" — sent when the user requests it from their profile.
        Task SendBoardingQrAsync(string toEmail, string firstName, string qrData, CancellationToken ct = default);
    }
}
