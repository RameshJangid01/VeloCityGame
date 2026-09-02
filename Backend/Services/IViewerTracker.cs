using System.Collections.Concurrent;

namespace BikeRacing.Backend.Services;

public interface IViewerTracker
{
    int AddViewer(string connectionId);
    int RemoveViewer(string connectionId);
    int CurrentCount { get; }
}

/// <summary>
/// Tracks connected public viewers via SignalR connection IDs only.
/// No personal/user data is stored - purely a count mechanism.
/// </summary>
public class ViewerTracker : IViewerTracker
{
    private readonly ConcurrentDictionary<string, byte> _connections = new();

    public int CurrentCount => _connections.Count;

    public int AddViewer(string connectionId)
    {
        _connections.TryAdd(connectionId, 0);
        return _connections.Count;
    }

    public int RemoveViewer(string connectionId)
    {
        _connections.TryRemove(connectionId, out _);
        return _connections.Count;
    }
}
