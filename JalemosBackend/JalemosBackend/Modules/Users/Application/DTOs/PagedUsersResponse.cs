namespace JalemosBackend.Modules.Users.Application.DTOs;

public sealed class PagedUsersResponse
{
    public IEnumerable<UserSummaryDto> Users { get; set; } = [];
    public int TotalCount  { get; set; }
    public int Page        { get; set; }
    public int PageSize    { get; set; }
    public int TotalPages  { get; set; }
}
