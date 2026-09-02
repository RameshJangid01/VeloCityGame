using BikeRacing.Backend.Data;
using BikeRacing.Backend.DTOs;
using BikeRacing.Backend.Hubs;
using BikeRacing.Backend.Models;
using Microsoft.AspNetCore.SignalR;
using MongoDB.Driver;

namespace BikeRacing.Backend.Services;

public class InvalidRaceOperationException : Exception
{
    public InvalidRaceOperationException(string message) : base(message) { }
}

public interface IAdminRaceService
{
    Task<Race> CreateRaceAsync(CreateRaceRequest req);
    Task<Race> StartNowAsync(string raceId);
    Task<Race> CancelAsync(string raceId);
    Task<Race> FinishNowAsync(string raceId);
}

public class AdminRaceService : IAdminRaceService
{
    private readonly MongoDbContext _db;
    private readonly IHubContext<RaceHub> _hub;
    private readonly IRaceStateProvider _stateProvider;

    public AdminRaceService(MongoDbContext db, IHubContext<RaceHub> hub, IRaceStateProvider stateProvider)
    {
        _db = db;
        _hub = hub;
        _stateProvider = stateProvider;
    }

    public async Task<Race> CreateRaceAsync(CreateRaceRequest req)
    {
        if (req.NumberOfBikes < 2)
            throw new InvalidRaceOperationException("A race needs at least 2 bikes.");

        if (req.DurationSeconds <= 0 || req.DurationSeconds > 3600)
            throw new InvalidRaceOperationException("Invalid duration.");

        if (req.StartTimeUtc <= DateTime.UtcNow)
            throw new InvalidRaceOperationException("Start time must be in the future.");

        var totalActiveBikes = await _db.Bikes.Find(b => b.IsActive).CountDocumentsAsync();
        if (req.NumberOfBikes > totalActiveBikes)
            throw new InvalidRaceOperationException($"Only {totalActiveBikes} active bikes are available.");

        var activeBikes = await _db.Bikes.Find(b => b.IsActive)
            .SortBy(b => b.BikeNumber)
            .Limit(req.NumberOfBikes)
            .ToListAsync();

        if (activeBikes.Count < req.NumberOfBikes)
            throw new InvalidRaceOperationException("Not enough active bikes available.");

        if (!activeBikes.Any(b => b.Id == req.WinnerBikeId))
            throw new InvalidRaceOperationException("Winner bike must be one of the selected race bikes.");

        // Prevent overlapping scheduled/running race at the exact same time slot conflict
        var overlapping = await _db.Races.Find(r =>
            (r.Status == RaceStatus.SCHEDULED || r.Status == RaceStatus.RUNNING) &&
            r.StartTime == req.StartTimeUtc).AnyAsync();
        if (overlapping)
            throw new InvalidRaceOperationException("A race is already scheduled at this exact start time.");

        var rnd = new Random();
        var raceBikes = activeBikes.Select((bike, index) => new RaceBikeEmbedded
        {
            BikeId = bike.Id,
            BikeNumber = bike.BikeNumber,
            Name = bike.Name,
            ImageUrl = bike.ImageUrl,
            DisplayOrder = index,
            // Non-winner bikes get randomized visual pace; the actual
            // winner is decided by the server's RaceFinished event only.
            SpeedFactor = Math.Round(0.85 + rnd.NextDouble() * 0.3, 3)
        }).ToList();

        var race = new Race
        {
            StartTime = req.StartTimeUtc,
            DurationSeconds = req.DurationSeconds,
            WinnerBikeId = req.WinnerBikeId,
            Status = RaceStatus.SCHEDULED,
            Bikes = raceBikes
        };

        await _db.Races.InsertOneAsync(race);

        var publicState = await _stateProvider.BuildPublicStateAsync(race);
        await _hub.Clients.All.SendAsync("RaceScheduled", publicState);

        return race;
    }

    public async Task<Race> StartNowAsync(string raceId)
    {
        var race = await LoadRaceAsync(raceId);
        if (race.Status != RaceStatus.SCHEDULED)
            throw new InvalidRaceOperationException("Only a scheduled race can be started now.");

        race.StartTime = DateTime.UtcNow;
        race.Status = RaceStatus.RUNNING;
        await _db.Races.ReplaceOneAsync(r => r.Id == race.Id, race);

        var publicState = await _stateProvider.BuildPublicStateAsync(race);
        await _hub.Clients.All.SendAsync("RaceStarted", publicState);
        return race;
    }

    public async Task<Race> CancelAsync(string raceId)
    {
        var race = await LoadRaceAsync(raceId);
        if (race.Status == RaceStatus.FINISHED)
            throw new InvalidRaceOperationException("Cannot cancel a finished race.");

        race.Status = RaceStatus.CANCELLED;
        await _db.Races.ReplaceOneAsync(r => r.Id == race.Id, race);

        var publicState = await _stateProvider.BuildPublicStateAsync(race);
        await _hub.Clients.All.SendAsync("RaceCancelled", publicState);
        return race;
    }

    public async Task<Race> FinishNowAsync(string raceId)
    {
        var race = await LoadRaceAsync(raceId);
        if (race.Status != RaceStatus.RUNNING)
            throw new InvalidRaceOperationException("Only a running race can be finished now.");

        race.Status = RaceStatus.FINISHED;
        race.FinishedAt = DateTime.UtcNow;
        await _db.Races.ReplaceOneAsync(r => r.Id == race.Id, race);

        var publicState = await _stateProvider.BuildPublicStateAsync(race);
        await _hub.Clients.All.SendAsync("RaceFinished", publicState);
        return race;
    }

    private async Task<Race> LoadRaceAsync(string raceId)
    {
        var race = await _db.Races.Find(r => r.Id == raceId).FirstOrDefaultAsync();
        if (race == null) throw new InvalidRaceOperationException("Race not found.");
        return race;
    }
}
