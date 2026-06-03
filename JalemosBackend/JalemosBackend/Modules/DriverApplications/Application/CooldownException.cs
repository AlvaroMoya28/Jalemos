namespace JalemosBackend.Modules.DriverApplications.Application;

public sealed class CooldownException(DateTime cooldownUntil) : Exception("Cooldown activo")
{
    public DateTime CooldownUntil { get; } = cooldownUntil;
}
