using BikeRacing.Backend.Auth;
using BikeRacing.Backend.Data;
using BikeRacing.Backend.DTOs;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;

namespace BikeRacing.Backend.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly MongoDbContext _db;
    private readonly JwtTokenService _jwt;

    public AuthController(MongoDbContext db, JwtTokenService jwt)
    {
        _db = db;
        _jwt = jwt;
    }

    [HttpPost("login")]
    public async Task<ActionResult<LoginResponse>> Login([FromBody] LoginRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Email) || string.IsNullOrWhiteSpace(req.Password))
            return BadRequest(new { message = "Email and password are required." });

        var admin = await _db.Admins.Find(a => a.Email == req.Email).FirstOrDefaultAsync();
        if (admin == null || !BCrypt.Net.BCrypt.Verify(req.Password, admin.PasswordHash))
            return Unauthorized(new { message = "Invalid email or password." });

        var (token, expiresAt) = _jwt.GenerateToken(admin);
        return Ok(new LoginResponse(token, admin.Email, expiresAt));
    }
}
