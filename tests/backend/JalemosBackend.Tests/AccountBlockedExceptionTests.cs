using JalemosBackend.Modules.Auth.Application;

namespace JalemosBackend.Tests;

public class AccountBlockedExceptionTests
{
    [Fact]
    public void Constructor_Deactivated_SetsMessageAndProperties()
    {
        var ex = new AccountBlockedException(isDeactivated: true);

        Assert.True(ex.IsDeactivated);
        Assert.Null(ex.SuspendedUntil);
        Assert.Equal("Cuenta desactivada", ex.Message);
    }

    [Fact]
    public void Constructor_Suspended_WithDate_SetsMessageAndProperties()
    {
        var until = new DateTime(2026, 12, 31, 23, 59, 59, DateTimeKind.Utc);

        var ex = new AccountBlockedException(isDeactivated: false, suspendedUntil: until);

        Assert.False(ex.IsDeactivated);
        Assert.Equal(until, ex.SuspendedUntil);
        Assert.Equal("Cuenta suspendida", ex.Message);
    }

    [Fact]
    public void Constructor_Suspended_WithoutDate_SuspendedUntilRemainsNull()
    {
        var ex = new AccountBlockedException(isDeactivated: false);

        Assert.False(ex.IsDeactivated);
        Assert.Null(ex.SuspendedUntil);
        Assert.Equal("Cuenta suspendida", ex.Message);
    }

    [Fact]
    public void InheritsFromException()
    {
        var ex = new AccountBlockedException(isDeactivated: true);

        Assert.IsAssignableFrom<Exception>(ex);
    }
}
