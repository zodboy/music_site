export type Provider = "netease" | "qq" | "kugou";

export interface RemoteTrack {
  provider: Provider;
  providerId: string;
  name: string;
  artist: string;
  album: string;
  cover?: string;
  durationMs: number;
}

export interface PlaylistTrackItem {
  id: number;
  playlistId: number;
  trackId: number;
  sort: number;
  addedAt: string;
  track: TrackInDB;
}

export interface TrackInDB {
  id: number;
  provider: Provider;
  providerId: string;
  name: string;
  artist: string;
  album: string;
  cover: string | null;
  durationMs: number;
  createdAt: string;
  updatedAt: string;
}

export interface Playlist {
  id: number;
  userId: number;
  name: string;
  description: string | null;
  cover: string | null;
  source: string;
  sourceId: string | null;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: { tracks: number };
  tracks?: PlaylistTrackItem[];
}

export interface User {
  id: number;
  username: string;
  role: string;
  createdAt: string;
}
