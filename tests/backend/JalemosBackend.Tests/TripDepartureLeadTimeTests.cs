using JalemosBackend.Modules.Trips.Application;

namespace JalemosBackend.Tests;

// Input/output tests for the "departure must be ≥5 min ahead" rule that prevents
// trips that can never reach the boarding window (the exact-minute / past-time bug).
public class TripDepartureLeadTimeTests
{
    private static readonly DateTime Now = new(2026, 06, 11, 12, 0, 0, DateTimeKind.Utc);

    [Fact]
    public void Rejects_DepartureInThePast()
    {
        Assert.False(TripsService.DepartureMeetsMinimumLeadTime(Now.AddMinutes(-1), Now));
    }

    [Fact]
    public void Rejects_DepartureRightNow()
    {
        Assert.False(TripsService.DepartureMeetsMinimumLeadTime(Now, Now));
    }

    [Fact]
    public void Rejects_DepartureTwoMinutesAhead()
    {
        // 2 min < 5 min lead (minus 1 min slack = 4 min threshold) → rejected.
        Assert.False(TripsService.DepartureMeetsMinimumLeadTime(Now.AddMinutes(2), Now));
    }

    [Fact]
    public void Accepts_DepartureFiveMinutesAhead()
    {
        Assert.True(TripsService.DepartureMeetsMinimumLeadTime(Now.AddMinutes(5), Now));
    }

    [Fact]
    public void Accepts_DepartureWithinSlackJustUnderFive()
    {
        // 4.5 min is within the slack window (threshold is 4 min) → accepted.
        Assert.True(TripsService.DepartureMeetsMinimumLeadTime(Now.AddMinutes(4.5), Now));
    }

    [Fact]
    public void NormalisesUnspecifiedKind_AsUtc()
    {
        var unspecified = DateTime.SpecifyKind(Now.AddMinutes(10), DateTimeKind.Unspecified);
        Assert.True(TripsService.DepartureMeetsMinimumLeadTime(unspecified, Now));
    }
}
