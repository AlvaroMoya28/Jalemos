using Microsoft.EntityFrameworkCore;
using JalemosBackend.Infrastructure.Persistence;
using JalemosBackend.Modules.TripReports.Application;
using JalemosBackend.Modules.TripReports.Application.DTOs;
using JalemosBackend.Modules.TripReports.Domain;
using JalemosBackend.Modules.TripReports.Infrastructure;

namespace JalemosBackend.Tests;

public class TripReportDomainTests
{
    [Fact]
    public void Verify_SetsStatusAndTimestamp()
    {
        var report = new TripReport { Status = TripReportStatus.Open, UpdatedAt = DateTime.MinValue };
        report.Verify("looks valid");
        Assert.Equal(TripReportStatus.Verified, report.Status);
        Assert.Equal("looks valid", report.AdminNotes);
        Assert.NotEqual(DateTime.MinValue, report.UpdatedAt);
        Assert.Null(report.ResolvedAt);
    }

    [Fact]
    public void Dismiss_SetsStatusAndResolvedAt()
    {
        var report = new TripReport { Status = TripReportStatus.Open, UpdatedAt = DateTime.MinValue };
        report.Dismiss("no evidence");
        Assert.Equal(TripReportStatus.Dismissed, report.Status);
        Assert.Equal("no evidence", report.AdminNotes);
        Assert.NotNull(report.ResolvedAt);
        Assert.NotEqual(DateTime.MinValue, report.UpdatedAt);
    }

    [Fact]
    public void TakeAction_SetsStatusAndResolvedAt()
    {
        var report = new TripReport { Status = TripReportStatus.Open, UpdatedAt = DateTime.MinValue };
        report.TakeAction("driver suspended");
        Assert.Equal(TripReportStatus.ActionTaken, report.Status);
        Assert.Equal("driver suspended", report.AdminNotes);
        Assert.NotNull(report.ResolvedAt);
    }

    [Fact]
    public void NewReport_DefaultStatusIsOpen()
    {
        var report = new TripReport();
        Assert.Equal(TripReportStatus.Open, report.Status);
    }
}

public class TripReportServiceValidationTests
{
    private static TripReportsService BuildService()
    {
        var opts = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        var db = new ApplicationDbContext(opts);
        return new TripReportsService(new TripReportsRepository(db), db);
    }

    [Fact]
    public async Task CreateAsync_NullDto_ThrowsArgumentNullException()
    {
        var svc = BuildService();
        await Assert.ThrowsAsync<ArgumentNullException>(() =>
            svc.CreateAsync(null!, Guid.NewGuid()));
    }

    [Fact]
    public async Task CreateAsync_EmptyTripId_ThrowsInvalidOperationException()
    {
        var svc = BuildService();
        var dto = new CreateTripReportDto { TripId = Guid.Empty, Type = "emergency", Description = "test" };
        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() =>
            svc.CreateAsync(dto, Guid.NewGuid()));
        Assert.Contains("tripId", ex.Message);
    }

    [Fact]
    public async Task CreateAsync_EmptyDescription_ThrowsInvalidOperationException()
    {
        var svc = BuildService();
        var dto = new CreateTripReportDto { TripId = Guid.NewGuid(), Type = "emergency", Description = "" };
        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() =>
            svc.CreateAsync(dto, Guid.NewGuid()));
        Assert.Contains("descripción", ex.Message);
    }

    [Fact]
    public async Task CreateAsync_InvalidType_ThrowsInvalidOperationException()
    {
        var svc = BuildService();
        var dto = new CreateTripReportDto { TripId = Guid.NewGuid(), Type = "unknown_type", Description = "test" };
        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() =>
            svc.CreateAsync(dto, Guid.NewGuid()));
        Assert.Contains("Tipo", ex.Message);
    }

    [Fact]
    public async Task CreateAsync_TripNotFound_ThrowsKeyNotFoundException()
    {
        var svc = BuildService();
        var dto = new CreateTripReportDto { TripId = Guid.NewGuid(), Type = "emergency", Description = "ayuda" };
        await Assert.ThrowsAsync<KeyNotFoundException>(() =>
            svc.CreateAsync(dto, Guid.NewGuid()));
    }

    [Fact]
    public async Task UpdateStatusAsync_NullDto_ThrowsArgumentNullException()
    {
        var svc = BuildService();
        await Assert.ThrowsAsync<ArgumentNullException>(() =>
            svc.UpdateStatusAsync(Guid.NewGuid(), null!));
    }

    [Fact]
    public async Task UpdateStatusAsync_InvalidStatus_ThrowsInvalidOperationException()
    {
        var svc = BuildService();
        var dto = new UpdateTripReportStatusDto { Status = "invalid_status" };
        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() =>
            svc.UpdateStatusAsync(Guid.NewGuid(), dto));
        Assert.Contains("Estado", ex.Message);
    }

    [Fact]
    public async Task UpdateStatusAsync_ReportNotFound_ThrowsKeyNotFoundException()
    {
        var svc = BuildService();
        var dto = new UpdateTripReportStatusDto { Status = "dismissed" };
        await Assert.ThrowsAsync<KeyNotFoundException>(() =>
            svc.UpdateStatusAsync(Guid.NewGuid(), dto));
    }
}
