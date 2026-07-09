using System.Text.Json;

namespace JalemosBackend.Modules.Auth.Application
{
    // Verified profile data extracted from a Google id_token.
    public sealed record GoogleProfile(string Sub, string Email, string FirstName, string LastName, string? Picture);

    // Validates a Google id_token by calling Google's public tokeninfo endpoint.
    // If the token is valid, Google returns the already-verified profile claims.
    public sealed class GoogleTokenValidator
    {
        private readonly IHttpClientFactory _httpFactory;
        private readonly IConfiguration _config;
        private readonly ILogger<GoogleTokenValidator> _logger;

        public GoogleTokenValidator(IHttpClientFactory httpFactory, IConfiguration config, ILogger<GoogleTokenValidator> logger)
        {
            _httpFactory = httpFactory;
            _config = config;
            _logger = logger;
        }

        // Returns the profile if the token is valid; null otherwise.
        public async Task<GoogleProfile?> ValidateAsync(string idToken, CancellationToken ct = default)
        {
            var http = _httpFactory.CreateClient();
            var url  = $"https://oauth2.googleapis.com/tokeninfo?id_token={Uri.EscapeDataString(idToken)}";

            HttpResponseMessage resp;
            try
            {
                resp = await http.GetAsync(url, ct);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Could not reach Google tokeninfo endpoint");
                return null;
            }

            if (!resp.IsSuccessStatusCode)
            {
                _logger.LogWarning("Google rejected the id_token (status {Status})", resp.StatusCode);
                return null;
            }

            using var stream = await resp.Content.ReadAsStreamAsync(ct);
            using var doc    = await JsonDocument.ParseAsync(stream, cancellationToken: ct);
            var root = doc.RootElement;

            // The token's "aud" must match one of OUR configured Google client IDs
            // (Web, iOS or Android). Depending on the device Google uses a different one.
            // If it matches none, the token was issued for another app and we don't trust it.
            var allowed = new[]
            {
                _config["Google:WebClientId"],
                _config["Google:IosClientId"],
                _config["Google:AndroidClientId"],
            }.Where(id => !string.IsNullOrWhiteSpace(id) && !id!.Contains("TU_")).ToArray();

            var aud = root.TryGetProperty("aud", out var a) ? a.GetString() : null;
            if (allowed.Length > 0 && !allowed.Contains(aud))
            {
                _logger.LogWarning("id_token aud ({Aud}) does not match any configured client ID", aud);
                return null;
            }

            var sub    = root.TryGetProperty("sub", out var s) ? s.GetString() : null;
            var email  = root.TryGetProperty("email", out var e) ? e.GetString() : null;
            var given  = root.TryGetProperty("given_name", out var g) ? g.GetString() : null;
            var family = root.TryGetProperty("family_name", out var f) ? f.GetString() : null;
            var name   = root.TryGetProperty("name", out var n) ? n.GetString() : null;
            var pic    = root.TryGetProperty("picture", out var p) ? p.GetString() : null;

            if (string.IsNullOrWhiteSpace(sub) || string.IsNullOrWhiteSpace(email))
                return null;

            // Fall back to splitting the display name when Google omits given/family name.
            if (string.IsNullOrWhiteSpace(given) && !string.IsNullOrWhiteSpace(name))
            {
                var parts = name!.Split(' ', 2, StringSplitOptions.RemoveEmptyEntries);
                given  = parts.Length > 0 ? parts[0] : name;
                family = parts.Length > 1 ? parts[1] : family;
            }

            return new GoogleProfile(
                sub!,
                email!,
                string.IsNullOrWhiteSpace(given) ? email! : given!,
                family ?? string.Empty,
                pic);
        }
    }
}
