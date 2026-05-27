namespace JalemosBackend.Modules.Users.Application.DTOs;

public sealed class ChangeRoleRequest
{
    /// <summary>"admin" | "passenger" | "driver"</summary>
    public string Role { get; set; } = string.Empty;
}
