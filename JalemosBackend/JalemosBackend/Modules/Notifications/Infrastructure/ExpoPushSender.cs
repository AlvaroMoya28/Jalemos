// Sends push notifications through Expo's push service (https://exp.host).
// Best-effort: failures are logged but never bubble up to the caller, because a
// push delivery problem must not fail the business operation that triggered it.

using System.Net.Http.Json;

namespace JalemosBackend.Modules.Notifications.Infrastructure;

/// <summary>A single Expo push message. <paramref name="To"/> is an Expo push token.</summary>
public sealed record ExpoPushMessage(string To, string Title, string? Body, object? Data = null);

public interface IExpoPushSender
{
    Task SendAsync(IReadOnlyCollection<ExpoPushMessage> messages, CancellationToken ct = default);
}

public sealed class ExpoPushSender : IExpoPushSender
{
    public const string HttpClientName = "expo-push";
    private const string Endpoint = "https://exp.host/--/api/v2/push/send";

    private readonly IHttpClientFactory _httpFactory;
    private readonly ILogger<ExpoPushSender> _logger;

    public ExpoPushSender(IHttpClientFactory httpFactory, ILogger<ExpoPushSender> logger)
    {
        _httpFactory = httpFactory;
        _logger      = logger;
    }

    public async Task SendAsync(IReadOnlyCollection<ExpoPushMessage> messages, CancellationToken ct = default)
    {
        if (messages.Count == 0) return;

        // Expo accepts an array of messages in a single request.
        var payload = messages.Select(m => new
        {
            to    = m.To,
            title = m.Title,
            body  = m.Body,
            sound = "default",
            data  = m.Data,
        });

        try
        {
            var client = _httpFactory.CreateClient(HttpClientName);
            using var resp = await client.PostAsJsonAsync(Endpoint, payload, ct);
            if (!resp.IsSuccessStatusCode)
            {
                var text = await resp.Content.ReadAsStringAsync(ct);
                _logger.LogWarning("Expo push returned {Status}: {Body}", (int)resp.StatusCode, text);
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Expo push request failed");
        }
    }
}
