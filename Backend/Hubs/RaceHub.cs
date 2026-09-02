using BikeRacing.Backend.Services;
using Microsoft.AspNetCore.SignalR;

namespace BikeRacing.Backend.Hubs;

/// <summary>
/// Public + admin SignalR hub at /hubs/race.
/// Handles connection tracking for live viewer counts and lets clients
/// request an immediate snapshot of the current race state on join
/// (important for users who refresh mid-race).
/// </summary>
public class RaceHub : Hub
{
    private readonly IViewerTracker _viewerTracker;
    private readonly IRaceStateProvider _raceStateProvider;

    public RaceHub(IViewerTracker viewerTracker, IRaceStateProvider raceStateProvider)
    {
        _viewerTracker = viewerTracker;
        _raceStateProvider = raceStateProvider;
    }

    public override async Task OnConnectedAsync()
    {
        var count = _viewerTracker.AddViewer(Context.ConnectionId);
        await Clients.All.SendAsync("ViewerCountChanged", count);

        // Send the current state immediately so a joining/refreshing
        // client synchronizes instead of starting from zero.
        var state = await _raceStateProvider.GetCurrentPublicStateAsync();
        if (state != null)
        {
            await Clients.Caller.SendAsync("RaceState", state);
        }

        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var count = _viewerTracker.RemoveViewer(Context.ConnectionId);
        await Clients.All.SendAsync("ViewerCountChanged", count);
        await base.OnDisconnectedAsync(exception);
    }

    // Clients can explicitly request a resync (e.g. after reconnect)
    public async Task RequestState()
    {
        var state = await _raceStateProvider.GetCurrentPublicStateAsync();
        if (state != null)
        {
            await Clients.Caller.SendAsync("RaceState", state);
        }
    }
}
