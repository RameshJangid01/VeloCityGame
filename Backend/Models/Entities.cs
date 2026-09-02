using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace BikeRacing.Backend.Models;

public class Admin
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; } = default!;

    public string Email { get; set; } = default!;

    public string PasswordHash { get; set; } = default!;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class Bike
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; } = default!;

    // Public display number e.g. 1..15, unique
    public int BikeNumber { get; set; }

    public string Name { get; set; } = default!;

    public string? ImageUrl { get; set; }

    public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

/// <summary>
/// A bike snapshot embedded inside a Race document. MongoDB favors
/// embedding over joins for data that is read together and doesn't
/// change independently once the race is created - this also preserves
/// a historical record of bike name/number even if the Bike document
/// is later edited.
/// </summary>
public class RaceBikeEmbedded
{
    public string BikeId { get; set; } = default!;
    public int BikeNumber { get; set; }
    public string Name { get; set; } = default!;
    public string? ImageUrl { get; set; }
    public int DisplayOrder { get; set; }
    public double SpeedFactor { get; set; } = 1.0;
}

public class Race
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; } = default!;

    public DateTime StartTime { get; set; } // UTC

    public int DurationSeconds { get; set; }

    public string WinnerBikeId { get; set; } = default!;

    [BsonRepresentation(BsonType.String)]
    public RaceStatus Status { get; set; } = RaceStatus.SCHEDULED;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? FinishedAt { get; set; }

    // Prevents duplicate/concurrent execution by the scheduler
    public bool IsProcessing { get; set; } = false;

    public List<RaceBikeEmbedded> Bikes { get; set; } = new();
}
