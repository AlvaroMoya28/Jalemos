namespace JalemosBackend.Modules.Auth.Application
{
    // Thrown when a verification code is requested again before the resend cooldown
    // has elapsed. Carries the seconds the client must wait before retrying.
    public sealed class ResendCooldownException : Exception
    {
        public int RetryAfterSeconds { get; }

        public ResendCooldownException(int retryAfterSeconds)
            : base($"Esperá {retryAfterSeconds} segundos antes de pedir otro código.")
        {
            RetryAfterSeconds = retryAfterSeconds;
        }
    }
}
