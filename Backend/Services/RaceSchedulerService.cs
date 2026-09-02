using BikeRacing.Backend.Data;
using BikeRacing.Backend.Hubs;
using BikeRacing.Backend.Models;
using Microsoft.AspNetCore.SignalR;
using MongoDB.Driver;

namespace BikeRacing.Backend.Services;

/// <summary>
/// The single authoritative race engine. Polls MongoDB on a fixed tick,
/// transitions race status based on SERVER (UTC) time only, and
/// broadcasts SignalR events. Never trusts client timers.
///
/// Recovery: on startup, any RUNNING race is re-evaluated against
/// StartTime + DurationSeconds so a server restart never resets a race
/// to zero - it either resumes broadcasting or is immediately finished
/// if the duration already elapsed while the server was down.
/// </summary>
public class RaceSchedulerService : BackgroundService
{
    private readonly IServiceProvider _services;
    private readonly ILogger<RaceSchedulerService> _logger;
    private static readonly TimeSpan TickInterval = TimeSpan.FromMilliseconds(500);

    public RaceSchedulerService(IServiceProvider services, ILogger<RaceSchedulerService> logger)
    {
        _services = services;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        await RecoverOnStartupAsync(stoppingToken);

        using var timer = new PeriodicTimer(TickInterval);
        while (!stoppingToken.IsCancellationRequested && await timer.WaitForNextTickAsync(stoppingToken))
        {
            try
            {
                await TickAsync(stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Race scheduler tick failed");
            }
        }
    }

    private async Task RecoverOnStartupAsync(CancellationToken ct)
    {
        using var scope = _services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<MongoDbContext>();

        var runningRaces = await db.Races.Find(r => r.Status == RaceStatus.RUNNING).ToListAsync(ct);
        var now = DateTime.UtcNow;

        foreach (var race in runningRaces)
        {
            var endTime = race.StartTime.AddSeconds(race.DurationSeconds);
            if (now >= endTime)
            {
                // Duration already elapsed while server was offline -> finish immediately.
                race.Status = RaceStatus.FINISHED;
                race.FinishedAt = endTime;
                race.IsProcessing = false;
                await db.Races.ReplaceOneAsync(r => r.Id == race.Id, race, cancellationToken: ct);
                _logger.LogInformation("Recovered race {RaceId} directly to FINISHED after server restart", race.Id);
            }
            else
            {
                // Still within duration -> leave RUNNING, scheduler will
                // pick up broadcasting on the next tick and finish it
                // naturally when the time comes.
                race.IsProcessing = false;
                await db.Races.ReplaceOneAsync(r => r.Id == race.Id, race, cancellationToken: ct);
                _logger.LogInformation("Recovered race {RaceId}, resuming RUNNING state", race.Id);
            }
        }

        // Any race stuck mid-processing flag from a crash gets cleared.
        var stuck = await db.Races.Find(r => r.IsProcessing && r.Status != RaceStatus.RUNNING).ToListAsync(ct);
        foreach (var r in stuck)
        {
            r.IsProcessing = false;
            await db.Races.ReplaceOneAsync(x => x.Id == r.Id, r, cancellationToken: ct);
        }
    }

    private async Task TickAsync(CancellationToken ct)
    {
        using var scope = _services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<MongoDbContext>();
        var hub = scope.ServiceProvider.GetRequiredService<IHubContext<RaceHub>>();
        var stateProvider = scope.ServiceProvider.GetRequiredService<IRaceStateProvider>();

        var now = DateTime.UtcNow;

        // 1) Start any SCHEDULED race whose time has come
        var toStart = await db.Races.Find(r =>
            r.Status == RaceStatus.SCHEDULED && r.StartTime <= now && !r.IsProcessing
        ).ToListAsync(ct);

        foreach (var race in toStart)
        {
            race.IsProcessing = true;
            await db.Races.ReplaceOneAsync(r => r.Id == race.Id, race, cancellationToken: ct);

            race.Status = RaceStatus.RUNNING;
            race.IsProcessing = false;
            await db.Races.ReplaceOneAsync(r => r.Id == race.Id, race, cancellationToken: ct);

            var publicState = await stateProvider.BuildPublicStateAsync(race);
            await hub.Clients.All.SendAsync("RaceStarted", publicState, ct);
            _logger.LogInformation("Race {RaceId} STARTED at server time {Now}", race.Id, now);
        }

        // 2) Finish any RUNNING race whose duration has elapsed
        var toFinish = await db.Races.Find(r =>
            r.Status == RaceStatus.RUNNING && !r.IsProcessing
        ).ToListAsync(ct);

        foreach (var race in toFinish)
        {
            var endTime = race.StartTime.AddSeconds(race.DurationSeconds);
            if (now < endTime) continue;

            race.IsProcessing = true;
            await db.Races.ReplaceOneAsync(r => r.Id == race.Id, race, cancellationToken: ct);

            race.Status = RaceStatus.FINISHED;
            race.FinishedAt = endTime;
            race.IsProcessing = false;
            await db.Races.ReplaceOneAsync(r => r.Id == race.Id, race, cancellationToken: ct);

            var publicState = await stateProvider.BuildPublicStateAsync(race);
            await hub.Clients.All.SendAsync("RaceFinished", publicState, ct);
            _logger.LogInformation("Race {RaceId} FINISHED, winner bike {WinnerId}", race.Id, race.WinnerBikeId);
        }

        // 3) Broadcast periodic state for any currently RUNNING or soon-to-start
        //    SCHEDULED race so all clients stay in sync (countdown, elapsed time).
        var soonThreshold = now.AddMinutes(10);
        var active = await db.Races.Find(r =>
            r.Status == RaceStatus.RUNNING ||
            (r.Status == RaceStatus.SCHEDULED && r.StartTime <= soonThreshold)
        ).SortBy(r => r.StartTime).ToListAsync(ct);

        foreach (var race in active)
        {
            var publicState = await stateProvider.BuildPublicStateAsync(race);
            await hub.Clients.All.SendAsync("RaceState", publicState, ct);
        }
    }
}
