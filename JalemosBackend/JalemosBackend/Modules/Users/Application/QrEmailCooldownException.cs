namespace JalemosBackend.Modules.Users.Application;

// Thrown when the user requests their boarding QR by email again before the
// cooldown has elapsed. Carries the seconds left before they may retry.
public sealed class QrEmailCooldownException : Exception
{
    public int RetryAfterSeconds { get; }

    public QrEmailCooldownException(int retryAfterSeconds)
        : base($"Ya enviamos tu QR hace poco. Esperá {retryAfterSeconds} segundos antes de pedirlo de nuevo.")
    {
        RetryAfterSeconds = retryAfterSeconds;
    }
}
