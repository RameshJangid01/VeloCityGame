export type RaceStatus = 'SCHEDULED' | 'RUNNING' | 'FINISHED' | 'CANCELLED';

// IDs are MongoDB ObjectId strings (24-char hex), not numbers.
export interface RaceBikeDto {
  bikeId: string;
  bikeNumber: number;
  name: string;
  imageUrl: string | null;
  displayOrder: number;
  speedFactor: number;
}

// Public race state - winner fields are null/undefined until FINISHED.
// This mirrors the backend security boundary exactly; the frontend
// must never assume or guess a winner before this arrives from the server.
export interface PublicRaceStateDto {
  raceId: string;
  status: RaceStatus;
  serverTimeUtc: string;
  startTimeUtc: string;
  durationSeconds: number;
  elapsedSeconds: number;
  remainingSeconds: number;
  bikes: RaceBikeDto[];
  winnerBikeId: string | null;
  winnerBikeNumber: number | null;
  viewerCount: number;
}

export interface AdminRaceDto {
  id: string;
  startTimeUtc: string;
  durationSeconds: number;
  status: RaceStatus;
  createdAt: string;
  finishedAt: string | null;
  winnerBikeId: string;
  winnerBikeNumber: number | null;
  bikes: RaceBikeDto[];
  viewerCount: number;
}

export interface WinnerHistoryItemDto {
  raceId: string;
  startTimeUtc: string;
  finishedAtUtc: string | null;
  durationSeconds: number;
  bikeCount: number;
  winnerBikeId: string;
  winnerBikeNumber: number;
  winnerBikeName: string;
}

export interface BikeDto {
  id: string;
  bikeNumber: number;
  name: string;
  imageUrl: string | null;
  isActive: boolean;
}

export interface PagedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
}
