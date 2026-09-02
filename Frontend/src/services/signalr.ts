import * as signalR from '@microsoft/signalr';
import { API_BASE_URL } from './api';

let connection: signalR.HubConnection | null = null;

export function getRaceConnection(): signalR.HubConnection {
  if (connection) return connection;

  connection = new signalR.HubConnectionBuilder()
    .withUrl(`${API_BASE_URL}/hubs/race`)
    .withAutomaticReconnect([0, 1000, 2000, 5000, 10000, 15000])
    .configureLogging(signalR.LogLevel.Warning)
    .build();

  return connection;
}
