import { api } from './api';
import type {
  PublicRaceStateDto, WinnerHistoryItemDto, PagedResult,
  AdminRaceDto, BikeDto
} from '../types';

// ---------- Public ----------
export const publicApi = {
  getCurrentRace: () => api.get<PublicRaceStateDto>('/api/public/current-race').then(r => r.data),
  getWinners: (page = 1, pageSize = 20) =>
    api.get<PagedResult<WinnerHistoryItemDto>>('/api/public/winners', { params: { page, pageSize } }).then(r => r.data),
  getRace: (raceId: string) =>
    api.get<PublicRaceStateDto>(`/api/public/races/${raceId}`).then(r => r.data),
  getServerTime: () => api.get<{ serverTimeUtc: string }>('/api/public/server-time').then(r => r.data),
};

// ---------- Admin ----------
export const adminApi = {
  login: (email: string, password: string) =>
    api.post('/api/auth/login', { email, password }).then(r => r.data),

  getRaces: (page = 1, pageSize = 20, status?: string) =>
    api.get<PagedResult<AdminRaceDto>>('/api/races', { params: { page, pageSize, status } }).then(r => r.data),
  getRace: (id: string) => api.get<AdminRaceDto>(`/api/races/${id}`).then(r => r.data),
  createRace: (payload: { numberOfBikes: number; startTimeUtc: string; durationSeconds: number; winnerBikeId: string }) =>
    api.post<AdminRaceDto>('/api/races', payload).then(r => r.data),
  startRace: (id: string) => api.post<AdminRaceDto>(`/api/races/${id}/start`).then(r => r.data),
  cancelRace: (id: string) => api.post<AdminRaceDto>(`/api/races/${id}/cancel`).then(r => r.data),
  finishRace: (id: string) => api.post<AdminRaceDto>(`/api/races/${id}/finish`).then(r => r.data),

  getBikes: () => api.get<BikeDto[]>('/api/bikes').then(r => r.data),
  createBike: (payload: { bikeNumber: number; name: string; imageUrl?: string }) =>
    api.post<BikeDto>('/api/bikes', payload).then(r => r.data),
  updateBike: (id: string, payload: { name: string; imageUrl?: string; isActive: boolean }) =>
    api.put<BikeDto>(`/api/bikes/${id}`, payload).then(r => r.data),
  deleteBike: (id: string) => api.delete(`/api/bikes/${id}`),
};
