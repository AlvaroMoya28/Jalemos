namespace JalemosBackend.Modules.Auth.Application;

public sealed class AccountBlockedException : Exception
{
    public bool IsDeactivated { get; }
    public DateTime? SuspendedUntil { get; }

    public AccountBlockedException(bool isDeactivated, DateTime? suspendedUntil = null)
        : base(isDeactivated ? "Cuenta desactivada" : "Cuenta suspendida")
    {
        IsDeactivated  = isDeactivated;
        SuspendedUntil = suspendedUntil;
    }
}
