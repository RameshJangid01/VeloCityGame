namespace BikeRacing.Backend.DTOs;

public record LoginRequest(string Email, string Password);
public record LoginResponse(string Token, string Email, DateTime ExpiresAt);

public record BikeDto(string Id, int BikeNumber, string Name, string? ImageUrl, bool IsActive);
public record CreateBikeRequest(int BikeNumber, string Name, string? ImageUrl);
public record UpdateBikeRequest(string Name, string? ImageUrl, bool IsActive);

public record CreateRaceRequest(int NumberOfBikes, DateTime StartTimeUtc, int DurationSeconds, string WinnerBikeId);

public record RaceBikeDto(string BikeId, int BikeNumber, string Name, string? ImageUrl, int DisplayOrder, double SpeedFactor);

// Admin-facing race dto includes winner regardless of status
public record AdminRaceDto(
    string Id,
    DateTime StartTimeUtc,
    int DurationSeconds,
    string Status,
    DateTime CreatedAt,
    DateTime? FinishedAt,
    string WinnerBikeId,
    int? WinnerBikeNumber,
    List<RaceBikeDto> Bikes,
    int ViewerCount
);

// Public race state - MUST NOT include WinnerBikeId unless FINISHED
public record PublicRaceStateDto(
    string RaceId,
    string Status,
    DateTime ServerTimeUtc,
    DateTime StartTimeUtc,
    int DurationSeconds,
    double ElapsedSeconds,
    double RemainingSeconds,
    List<RaceBikeDto> Bikes,
    string? WinnerBikeId,
    int? WinnerBikeNumber,
    int ViewerCount
);

public record WinnerHistoryItemDto(
    string RaceId,
    DateTime StartTimeUtc,
    DateTime? FinishedAtUtc,
    int DurationSeconds,
    int BikeCount,
    string WinnerBikeId,
    int WinnerBikeNumber,
    string WinnerBikeName
);

public record PagedResult<T>(List<T> Items, int Page, int PageSize, int TotalCount);
