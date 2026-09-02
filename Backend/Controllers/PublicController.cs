using BikeRacing.Backend.Data;
using BikeRacing.Backend.DTOs;
using BikeRacing.Backend.Models;
using BikeRacing.Backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;

namespace BikeRacing.Backend.Controllers;

[ApiController]
[Route("api/public")]
[AllowAnonymous]
public class PublicController : ControllerBase
{
    private readonly MongoDbContext _db;
    private readonly IRaceStateProvider _stateProvider;

    public PublicController(MongoDbContext db, IRaceStateProvider stateProvider)
    {
        _db = db;
        _stateProvider = stateProvider;
    }

    [HttpGet("current-race")]
    public async Task<ActionResult<PublicRaceStateDto>> GetCurrentRace()
    {
        var state = await _stateProvider.GetCurrentPublicStateAsync();
        if (state == null) return NotFound(new { message = "No races available yet." });
        return Ok(state);
    }

    [HttpGet("winners")]
    public async Task<ActionResult<PagedResult<WinnerHistoryItemDto>>> GetWinners([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 50);

        // ONLY finished races are ever surfaced in public winner history.
        var filter = Builders<Race>.Filter.Eq(r => r.Status, RaceStatus.FINISHED);

        var total = (int)await _db.Races.CountDocumentsAsync(filter);
        var races = await _db.Races.Find(filter)
            .SortByDescending(r => r.FinishedAt)
            .Skip((page - 1) * pageSize).Limit(pageSize)
            .ToListAsync();

        var items = races.Select(r =>
        {
            var winnerBike = r.Bikes.FirstOrDefault(b => b.BikeId == r.WinnerBikeId);
            return new WinnerHistoryItemDto(
                r.Id, r.StartTime, r.FinishedAt, r.DurationSeconds,
                r.Bikes.Count, r.WinnerBikeId,
                winnerBike?.BikeNumber ?? 0, winnerBike?.Name ?? "Unknown"
            );
        }).ToList();

        return Ok(new PagedResult<WinnerHistoryItemDto>(items, page, pageSize, total));
    }

    [HttpGet("races/{raceId}")]
    public async Task<ActionResult<PublicRaceStateDto>> GetRace(string raceId)
    {
        var race = await _db.Races.Find(r => r.Id == raceId).FirstOrDefaultAsync();
        if (race == null) return NotFound();

        // Only expose full public details for non-scheduled-secret races.
        // (Scheduled races are fine to view too, minus the winner - the
        // state provider already enforces that.)
        var state = await _stateProvider.BuildPublicStateAsync(race);
        return Ok(state);
    }

    [HttpGet("server-time")]
    public ActionResult<object> GetServerTime()
    {
        return Ok(new { serverTimeUtc = DateTime.UtcNow });
    }
}
