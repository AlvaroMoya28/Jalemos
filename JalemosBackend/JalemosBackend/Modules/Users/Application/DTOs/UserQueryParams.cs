namespace JalemosBackend.Modules.Users.Application.DTOs;

public sealed class UserQueryParams
{
    public string? Search   { get; set; }
    /// <summary>"admin" | "passenger" | "driver"</summary>
    public string? Role     { get; set; }
    /// <summary>"active" | "suspended" | "deactivated"</summary>
    public string? Status   { get; set; }
    /// <summary>name_asc | name_desc | rating_asc | rating_desc | trips_asc | trips_desc | newest | oldest</summary>
    public string  SortBy   { get; set; } = "name_asc";
    public int     Page     { get; set; } = 1;
    public int     PageSize { get; set; } = 30;
}
