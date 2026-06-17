using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;

namespace JalemosBackend.Modules.Email
{
    public sealed class EmailService : IEmailService
    {
        private readonly IConfiguration _config;
        private readonly ILogger<EmailService> _logger;

        public EmailService(IConfiguration config, ILogger<EmailService> logger)
        {
            _config = config;
            _logger = logger;
        }

        public async Task SendVerificationCodeAsync(string toEmail, string firstName, string code, CancellationToken ct = default)
        {
            var message = new MimeMessage();
            message.From.Add(new MailboxAddress(_config["Email:FromName"], _config["Email:FromAddress"]));
            message.To.Add(new MailboxAddress(firstName, toEmail));
            message.Subject = "Tu código de verificación — Jalemos";

            message.Body = new BodyBuilder
            {
                HtmlBody = $"""
                    <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:32px 24px;background:#f9f9f9;border-radius:12px;">
                      <h2 style="color:#0d6e55;margin-bottom:4px;">Jalemos</h2>
                      <p style="color:#333;">Hola <strong>{firstName}</strong>,</p>
                      <p style="color:#333;">Para completar tu registro ingresá el siguiente código en la app:</p>
                      <div style="font-size:38px;font-weight:bold;letter-spacing:12px;color:#0d6e55;text-align:center;padding:20px 0;background:#e8f7f3;border-radius:8px;margin:16px 0;">{code}</div>
                      <p style="color:#888;font-size:13px;">El código es válido por <strong>15 minutos</strong>. Si no creaste esta cuenta, podés ignorar este correo.</p>
                      <hr style="border:none;border-top:1px solid #e0e0e0;margin:24px 0;"/>
                      <p style="color:#aaa;font-size:11px;text-align:center;">© Jalemos · Costa Rica</p>
                    </div>
                    """,
            }.ToMessageBody();

            using var client = new SmtpClient();
            await client.ConnectAsync(
                _config["Email:Host"],
                int.Parse(_config["Email:Port"] ?? "587"),
                SecureSocketOptions.StartTls,
                ct);
            await client.AuthenticateAsync(_config["Email:Username"], _config["Email:Password"], ct);
            await client.SendAsync(message, ct);
            await client.DisconnectAsync(true, ct);

            _logger.LogInformation("Verification email sent to {Email}", toEmail);
        }
    }
}
