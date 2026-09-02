using BikeRacing.Backend.Models;
using MongoDB.Driver;

namespace BikeRacing.Backend.Data;

public static class DbSeeder
{
    public static async Task SeedAsync(MongoDbContext db)
    {
        if (await db.Admins.CountDocumentsAsync(FilterDefinition<Admin>.Empty) == 0)
        {
            await db.Admins.InsertOneAsync(new Admin
            {
                Email = "admin@bikeracing.com",
                // Default demo password: Admin@123  (CHANGE IN PRODUCTION)
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin@123")
            });
        }

        if (await db.Bikes.CountDocumentsAsync(FilterDefinition<Bike>.Empty) == 0)
        {
            var bikes = new List<Bike>();
            for (int i = 1; i <= 15; i++)
            {
                bikes.Add(new Bike
                {
                    BikeNumber = i,
                    Name = $"Bike {i:D2}",
                    ImageUrl = null,
                    IsActive = true
                });
            }
            await db.Bikes.InsertManyAsync(bikes);
        }

        if (await db.Races.CountDocumentsAsync(FilterDefinition<Race>.Empty) == 0)
        {
            var bikes = await db.Bikes.Find(b => true).SortBy(b => b.BikeNumber).Limit(15).ToListAsync();
            if (bikes.Count < 15) return;

            var startTime = DateTime.UtcNow.AddMinutes(2);
            var winnerBike = bikes[6]; // Bike 07

            var rnd = new Random();
            var raceBikes = bikes.Select((bike, index) => new RaceBikeEmbedded
            {
                BikeId = bike.Id,
                BikeNumber = bike.BikeNumber,
                Name = bike.Name,
                ImageUrl = bike.ImageUrl,
                DisplayOrder = index,
                SpeedFactor = Math.Round(0.85 + rnd.NextDouble() * 0.3, 3)
            }).ToList();

            var race = new Race
            {
                StartTime = startTime,
                DurationSeconds = 15,
                WinnerBikeId = winnerBike.Id,
                Status = RaceStatus.SCHEDULED,
                Bikes = raceBikes
            };

            await db.Races.InsertOneAsync(race);
        }
    }
}
