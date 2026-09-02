using BikeRacing.Backend.Data;
using BikeRacing.Backend.DTOs;
using BikeRacing.Backend.Models;
using MongoDB.Driver;

namespace BikeRacing.Backend.Services;

public interface IRaceStateProvider
{
    Task<PublicRaceStateDto?> GetCurrentPublicStateAsync();
    Task<PublicRaceStateDto?> BuildPublicStateAsync(Race race);
    Task<AdminRaceDto> BuildAdminStateAsync(Race race);
}

/// <summary>
/// Single source of truth for turning a Race document into DTOs.
/// This is the ONLY place that decides whether WinnerBikeId is included,
/// which is the critical security boundary: public DTOs never carry the
/// winner until the race Status is FINISHED.
/// </summary>
public class RaceStateProvider : IRaceStateProvider
{
    private readonly MongoDbContext _db;
    private readonly IViewerTracker _viewerTracker;

    public RaceStateProvider(MongoDbContext db, IViewerTracker viewerTracker)
    {
        _db = db;
        _viewerTracker = viewerTracker;
    }

    public async Task<PublicRaceStateDto?> GetCurrentPublicStateAsync()
    {
        // Prefer a currently running race, else the next scheduled one,
        // else the most recently finished one.
        var race = await _db.Races.Find(r => r.Status == RaceStatus.RUNNING)
            .SortBy(r => r.StartTime)
            .FirstOrDefaultAsync();

        race ??= await _db.Races.Find(r => r.Status == RaceStatus.SCHEDULED)
            .SortBy(r => r.StartTime)
            .FirstOrDefaultAsync();

        race ??= await _db.Races.Find(r => r.Status == RaceStatus.FINISHED)
            .SortByDescending(r => r.FinishedAt)
            .FirstOrDefaultAsync();

        if (race == null) return null;

        return await BuildPublicStateAsync(race);
    }

    public Task<PublicRaceStateDto?> BuildPublicStateAsync(Race race)
    {
        var now = DateTime.UtcNow;
        var elapsed = Math.Max(0, (now - race.StartTime).TotalSeconds);
        elapsed = Math.Min(elapsed, race.DurationSeconds);
        var remaining = Math.Max(0, race.DurationSeconds - elapsed);

        var bikes = race.Bikes
            .OrderBy(rb => rb.DisplayOrder)
            .Select(rb => new RaceBikeDto(rb.BikeId, rb.BikeNumber, rb.Name, rb.ImageUrl, rb.DisplayOrder, rb.SpeedFactor))
            .ToList();

        bool finished = race.Status == RaceStatus.FINISHED;
        var winnerBike = finished ? race.Bikes.FirstOrDefault(b => b.BikeId == race.WinnerBikeId) : null;

        var dto = new PublicRaceStateDto(
            RaceId: race.Id,
            Status: race.Status.ToString(),
            ServerTimeUtc: now,
            StartTimeUtc: race.StartTime,
            DurationSeconds: race.DurationSeconds,
            ElapsedSeconds: race.Status == RaceStatus.SCHEDULED ? 0 : elapsed,
            RemainingSeconds: race.Status == RaceStatus.SCHEDULED
                ? (race.StartTime - now).TotalSeconds
                : remaining,
            Bikes: bikes,
            // SECURITY BOUNDARY: only populated when finished
            WinnerBikeId: finished ? race.WinnerBikeId : null,
            WinnerBikeNumber: finished ? winnerBike?.BikeNumber : null,
            ViewerCount: _viewerTracker.CurrentCount
        );

        return Task.FromResult<PublicRaceStateDto?>(dto);
    }

    public Task<AdminRaceDto> BuildAdminStateAsync(Race race)
    {
        var bikes = race.Bikes
            .OrderBy(rb => rb.DisplayOrder)
            .Select(rb => new RaceBikeDto(rb.BikeId, rb.BikeNumber, rb.Name, rb.ImageUrl, rb.DisplayOrder, rb.SpeedFactor))
            .ToList();

        var winnerBike = race.Bikes.FirstOrDefault(b => b.BikeId == race.WinnerBikeId);

        var dto = new AdminRaceDto(
            Id: race.Id,
            StartTimeUtc: race.StartTime,
            DurationSeconds: race.DurationSeconds,
            Status: race.Status.ToString(),
            CreatedAt: race.CreatedAt,
            FinishedAt: race.FinishedAt,
            WinnerBikeId: race.WinnerBikeId,
            WinnerBikeNumber: winnerBike?.BikeNumber,
            Bikes: bikes,
            ViewerCount: _viewerTracker.CurrentCount
        );

        return Task.FromResult(dto);
    }
}
