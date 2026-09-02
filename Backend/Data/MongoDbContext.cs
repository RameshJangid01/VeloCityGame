using BikeRacing.Backend.Models;
using MongoDB.Driver;

namespace BikeRacing.Backend.Data;

public class MongoSettings
{
    public string ConnectionString { get; set; } = default!;
    public string DatabaseName { get; set; } = default!;
}

/// <summary>
/// Thin wrapper around the MongoDB database + typed collections.
/// Registered as a Singleton - IMongoClient/IMongoDatabase are thread-safe
/// and designed to be reused across the app's lifetime (unlike EF's
/// per-request DbContext).
/// </summary>
public class MongoDbContext
{
    public IMongoDatabase Database { get; }

    public IMongoCollection<Admin> Admins => Database.GetCollection<Admin>("admins");
    public IMongoCollection<Bike> Bikes => Database.GetCollection<Bike>("bikes");
    public IMongoCollection<Race> Races => Database.GetCollection<Race>("races");

    public MongoDbContext(MongoSettings settings)
    {
        var client = new MongoClient(settings.ConnectionString);
        Database = client.GetDatabase(settings.DatabaseName);

        EnsureIndexes();
    }

    private void EnsureIndexes()
    {
        Admins.Indexes.CreateOne(new CreateIndexModel<Admin>(
            Builders<Admin>.IndexKeys.Ascending(a => a.Email),
            new CreateIndexOptions { Unique = true }));

        Bikes.Indexes.CreateOne(new CreateIndexModel<Bike>(
            Builders<Bike>.IndexKeys.Ascending(b => b.BikeNumber),
            new CreateIndexOptions { Unique = true }));

        Races.Indexes.CreateOne(new CreateIndexModel<Race>(
            Builders<Race>.IndexKeys.Ascending(r => r.Status)));

        Races.Indexes.CreateOne(new CreateIndexModel<Race>(
            Builders<Race>.IndexKeys.Ascending(r => r.StartTime)));
    }
}
