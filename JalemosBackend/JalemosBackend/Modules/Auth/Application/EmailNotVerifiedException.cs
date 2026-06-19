namespace JalemosBackend.Modules.Auth.Application
{
    // Thrown by LoginAsync when the credentials are valid but the account's email
    // has not been verified yet. Carries the identifiers the client needs to jump
    // to the verification screen and request a new code.
    public sealed class EmailNotVerifiedException : Exception
    {
        public Guid UserId { get; }
        public string Email { get; }

        public EmailNotVerifiedException(Guid userId, string email)
            : base("Debés verificar tu correo antes de iniciar sesión.")
        {
            UserId = userId;
            Email = email;
        }
    }
}
