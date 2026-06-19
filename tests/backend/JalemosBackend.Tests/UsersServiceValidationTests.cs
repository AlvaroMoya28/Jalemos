using Microsoft.EntityFrameworkCore;
using JalemosBackend.Infrastructure.Persistence;
using JalemosBackend.Modules.Email;
using JalemosBackend.Modules.Storage;
using JalemosBackend.Modules.Users.Application;
using JalemosBackend.Modules.Users.Application.DTOs;
using JalemosBackend.Modules.Users.Infrastructure;

namespace JalemosBackend.Tests;

public class UsersServiceValidationTests
{
    // Minimal storage stub — these tests never touch photo uploads.
    private sealed class FakeStorageService : IStorageService
    {
        public Task<string?> UploadBase64Async(string? base64Data, string folder, CancellationToken ct = default)
            => Task.FromResult<string?>(null);
    }

    // Minimal email stub — these tests never send mail.
    private sealed class FakeEmailService : IEmailService
    {
        public Task SendVerificationCodeAsync(string toEmail, string firstName, string code, CancellationToken ct = default)
            => Task.CompletedTask;
        public Task SendWelcomeWithQrAsync(string toEmail, string firstName, string qrData, CancellationToken ct = default)
            => Task.CompletedTask;
        public Task SendBoardingQrAsync(string toEmail, string firstName, string qrData, CancellationToken ct = default)
            => Task.CompletedTask;
    }

    private static UsersService BuildService()
    {
        var opts = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        return new UsersService(new UsersRepository(new ApplicationDbContext(opts)), new FakeStorageService(), new FakeEmailService());
    }

    [Fact]
    public async Task ChangeRoleAsync_UnknownRole_ThrowsArgumentException()
    {
        var svc = BuildService();

        var ex = await Assert.ThrowsAsync<ArgumentException>(() =>
            svc.ChangeRoleAsync(Guid.NewGuid(), "superuser"));

        Assert.Contains("superuser", ex.Message);
    }

    [Fact]
    public async Task ChangeRoleAsync_EmptyRole_ThrowsArgumentException()
    {
        var svc = BuildService();

        await Assert.ThrowsAsync<ArgumentException>(() =>
            svc.ChangeRoleAsync(Guid.NewGuid(), ""));
    }

    [Fact]
    public async Task BanAsync_NegativeDays_ThrowsArgumentException()
    {
        var svc = BuildService();

        var ex = await Assert.ThrowsAsync<ArgumentException>(() =>
            svc.BanAsync(Guid.NewGuid(), days: -1));

        Assert.Contains("0", ex.Message);
    }

    [Fact]
    public async Task GetPagedAsync_PageBelowOne_ResponsePageClampedToOne()
    {
        var svc = BuildService();
        var queryParams = new UserQueryParams { Page = 0, PageSize = 10 };

        var result = await svc.GetPagedAsync(queryParams);

        Assert.Equal(1, result.Page);
    }

    [Fact]
    public async Task GetPagedAsync_PageSizeAboveHundred_ResponsePageSizeClampedToHundred()
    {
        var svc = BuildService();
        var queryParams = new UserQueryParams { Page = 1, PageSize = 200 };

        var result = await svc.GetPagedAsync(queryParams);

        Assert.Equal(100, result.PageSize);
    }

    [Fact]
    public async Task GetPagedAsync_EmptyDatabase_ReturnsZeroTotals()
    {
        var svc = BuildService();
        var queryParams = new UserQueryParams();

        var result = await svc.GetPagedAsync(queryParams);

        Assert.Equal(0, result.TotalCount);
        Assert.Equal(0, result.TotalPages);
        Assert.Empty(result.Users);
    }
}
