using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;
using MimeKit.Utils;
using QRCoder;

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
            var body = new BodyBuilder
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
            };

            await SendAsync(toEmail, firstName, "Tu código de verificación — Jalemos", body, ct);
            _logger.LogInformation("Verification email sent to {Email}", toEmail);
        }

        public async Task SendWelcomeWithQrAsync(string toEmail, string firstName, string qrData, CancellationToken ct = default)
        {
            var pngBytes = GenerateQrPng(qrData);

            var body = new BodyBuilder();
            var qrImage = body.LinkedResources.Add("qr.png", pngBytes);
            qrImage.ContentId = MimeUtils.GenerateMessageId();
            qrImage.ContentType.MediaType = "image";
            qrImage.ContentType.MediaSubtype = "png";

            body.HtmlBody = $"""
                <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:32px 24px;background:#f9f9f9;border-radius:12px;">
                  <h2 style="color:#0d6e55;margin-bottom:4px;">¡Bienvenido a Jalemos, {firstName}! 🎉</h2>
                  <p style="color:#333;">Tu cuenta quedó verificada. Ya podés compartir viajes y ahorrar en cada ruta.</p>
                  <p style="color:#333;margin-top:20px;">Este es tu <strong>QR de abordaje</strong>. Mostralo al conductor para registrarte en el vehículo. Es único e intransferible:</p>
                  <div style="text-align:center;padding:20px 0;">
                    <img src="cid:{qrImage.ContentId}" alt="Tu QR de abordaje" width="220" height="220" style="border:6px solid #e8f7f3;border-radius:12px;background:#ffffff;"/>
                  </div>
                  <p style="color:#888;font-size:13px;">También podés verlo en cualquier momento desde tu perfil en la app.</p>
                  <hr style="border:none;border-top:1px solid #e0e0e0;margin:24px 0;"/>
                  <p style="color:#aaa;font-size:11px;text-align:center;">© Jalemos · Costa Rica</p>
                </div>
                """;

            await SendAsync(toEmail, firstName, "¡Bienvenido a Jalemos! Tu QR de abordaje", body, ct);
            _logger.LogInformation("Welcome email sent to {Email}", toEmail);
        }

        // Renders the QR as a PNG: dark green (#0a3f39) modules on white, matching the in-app QR.
        private static byte[] GenerateQrPng(string data)
        {
            using var generator = new QRCodeGenerator();
            using var qrCodeData = generator.CreateQrCode(data, QRCodeGenerator.ECCLevel.Q);
            var pngQr = new PngByteQRCode(qrCodeData);
            return pngQr.GetGraphic(
                pixelsPerModule: 10,
                darkColorRgba:  new byte[] { 0x0a, 0x3f, 0x39, 0xff },
                lightColorRgba: new byte[] { 0xff, 0xff, 0xff, 0xff });
        }

        private async Task SendAsync(string toEmail, string toName, string subject, BodyBuilder body, CancellationToken ct)
        {
            var message = new MimeMessage();
            message.From.Add(new MailboxAddress(_config["Email:FromName"], _config["Email:FromAddress"]));
            message.To.Add(new MailboxAddress(toName, toEmail));
            message.Subject = subject;
            message.Body = body.ToMessageBody();

            using var client = new SmtpClient();
            await client.ConnectAsync(
                _config["Email:Host"],
                int.Parse(_config["Email:Port"] ?? "587"),
                SecureSocketOptions.StartTls,
                ct);
            await client.AuthenticateAsync(_config["Email:Username"], _config["Email:Password"], ct);
            await client.SendAsync(message, ct);
            await client.DisconnectAsync(true, ct);
        }
    }
}
