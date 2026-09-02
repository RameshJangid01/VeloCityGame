using BikeRacing.Backend.Data;
using BikeRacing.Backend.DTOs;
using BikeRacing.Backend.Models;
using BikeRacing.Backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;

namespace BikeRacing.Backend.Controllers;

[ApiController]
[Route("api/races")]
[Authorize(Roles = "Admin")]
public class RacesController : ControllerBase
{
    private readonly MongoDbContext _db;
    private readonly IAdminRaceService _adminRaceService;
    private readonly IRaceStateProvider _stateProvider;

    public RacesController(MongoDbContext db, IAdminRaceService adminRaceService, IRaceStateProvider stateProvider)
    {
        _db = db;
        _adminRaceService = adminRaceService;
        _stateProvider = stateProvider;
    }

    [HttpGet]
    public async Task<ActionResult<PagedResult<AdminRaceDto>>> GetAll([FromQuery] int page = 1, [FromQuery] int pageSize = 20, [FromQuery] string? status = null)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var filter = Builders<Race>.Filter.Empty;
        if (!string.IsNullOrWhiteSpace(status) && Enum.TryParse<RaceStatus>(status, true, out var st))
            filter = Builders<Race>.Filter.Eq(r => r.Status, st);

        var total = (int)await _db.Races.CountDocumentsAsync(filter);
        var races = await _db.Races.Find(filter)
            .SortByDescending(r => r.StartTime)
            .Skip((page - 1) * pageSize).Limit(pageSize)
            .ToListAsync();

        var items = new List<AdminRaceDto>();
        foreach (var r in races) items.Add(await _stateProvider.BuildAdminStateAsync(r));

        return Ok(new PagedResult<AdminRaceDto>(items, page, pageSize, total));
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<AdminRaceDto>> GetById(string id)
    {
        var race = await _db.Races.Find(r => r.Id == id).FirstOrDefaultAsync();
        if (race == null) return NotFound();
        return Ok(await _stateProvider.BuildAdminStateAsync(race));
    }

    [HttpPost]
    public async Task<ActionResult<AdminRaceDto>> Create([FromBody] CreateRaceRequest req)
    {
        try
        {
            var race = await _adminRaceService.CreateRaceAsync(req);
            return Ok(await _stateProvider.BuildAdminStateAsync(race));
        }
        catch (InvalidRaceOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("{id}/start")]
    public async Task<ActionResult<AdminRaceDto>> Start(string id)
    {
        try
        {
            var race = await _adminRaceService.StartNowAsync(id);
            return Ok(await _stateProvider.BuildAdminStateAsync(race));
        }
        catch (InvalidRaceOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("{id}/cancel")]
    public async Task<ActionResult<AdminRaceDto>> Cancel(string id)
    {
        try
        {
            var race = await _adminRaceService.CancelAsync(id);
            return Ok(await _stateProvider.BuildAdminStateAsync(race));
        }
        catch (InvalidRaceOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("{id}/finish")]
    public async Task<ActionResult<AdminRaceDto>> Finish(string id)
    {
        try
        {
            var race = await _adminRaceService.FinishNowAsync(id);
            return Ok(await _stateProvider.BuildAdminStateAsync(race));
        }
        catch (InvalidRaceOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}
