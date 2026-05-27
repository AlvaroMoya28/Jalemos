namespace JalemosBackend.Modules.Users.Application.DTOs;

public sealed class BanUserRequest
{
    /// <summary>Days to suspend. 0 = permanent (year 9999).</summary>
    public int Days { get; set; }
}
