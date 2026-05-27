namespace JalemosBackend.Modules.DriverApplications.Application.DTOs;

public sealed record ReviewActionRequest(
    string[] IssueIds,
    string   Notes
);
