using BikeRacing.Backend.Data;
using BikeRacing.Backend.DTOs;
using BikeRacing.Backend.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;

namespace BikeRacing.Backend.Controllers;

[ApiController]
[Route("api/bikes")]
public class BikesController : ControllerBase
{
    private readonly MongoDbContext _db;

    public BikesController(MongoDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<List<BikeDto>>> GetAll()
    {
        var bikes = await _db.Bikes.Find(b => true).SortBy(b => b.BikeNumber).ToListAsync();
        var dtos = bikes.Select(b => new BikeDto(b.Id, b.BikeNumber, b.Name, b.ImageUrl, b.IsActive)).ToList();
        return Ok(dtos);
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<BikeDto>> Create([FromBody] CreateBikeRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Name))
            return BadRequest(new { message = "Bike name is required." });

        var exists = await _db.Bikes.Find(b => b.BikeNumber == req.BikeNumber).AnyAsync();
        if (exists) return Conflict(new { message = $"Bike number {req.BikeNumber} already exists." });

        var bike = new Bike { BikeNumber = req.BikeNumber, Name = req.Name, ImageUrl = req.ImageUrl, IsActive = true };
        await _db.Bikes.InsertOneAsync(bike);

        return Ok(new BikeDto(bike.Id, bike.BikeNumber, bike.Name, bike.ImageUrl, bike.IsActive));
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<BikeDto>> Update(string id, [FromBody] UpdateBikeRequest req)
    {
        var bike = await _db.Bikes.Find(b => b.Id == id).FirstOrDefaultAsync();
        if (bike == null) return NotFound();

        bike.Name = req.Name;
        bike.ImageUrl = req.ImageUrl;
        bike.IsActive = req.IsActive;
        await _db.Bikes.ReplaceOneAsync(b => b.Id == id, bike);

        return Ok(new BikeDto(bike.Id, bike.BikeNumber, bike.Name, bike.ImageUrl, bike.IsActive));
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(string id)
    {
        var bike = await _db.Bikes.Find(b => b.Id == id).FirstOrDefaultAsync();
        if (bike == null) return NotFound();

        var usedInRace = await _db.Races.Find(r => r.Bikes.Any(rb => rb.BikeId == id)).AnyAsync();
        if (usedInRace)
            return Conflict(new { message = "Bike is used in existing races and cannot be deleted. Disable it instead." });

        await _db.Bikes.DeleteOneAsync(b => b.Id == id);
        return NoContent();
    }
}
