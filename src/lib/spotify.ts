import axios from 'axios';

const CLIENT_ID = '7826777c157c43c080e538950ce5346e';

const getRedirectUri = () => {
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://127.0.0.1:8080/callback';
  }
  return `${window.location.origin}/callback`;
};

const SCOPES = [
  'user-read-private',
  'user-read-email',
  'playlist-read-private',
  'playlist-read-collaborative',
  'streaming',
  'user-read-playback-state',
  'user-modify-playback-state',
  'user-read-currently-playing'
];

const generateRandomString = (length: number) => {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const values = crypto.getRandomValues(new Uint8Array(length));
  return values.reduce((acc, x) => acc + possible[x % possible.length], "");
};

const sha256 = async (plain: string) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  return window.crypto.subtle.digest('SHA-256', data);
};

const base64urlencode = (a: ArrayBuffer) => {
  return btoa(String.fromCharCode(...new Uint8Array(a)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
};

export const redirectToAuthCodeFlow = async () => {
  const codeVerifier = generateRandomString(64);
  const codeChallenge = base64urlencode(await sha256(codeVerifier));
  window.localStorage.setItem('pkce_code_verifier', codeVerifier);

  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: 'code',
    redirect_uri: getRedirectUri(),
    scope: SCOPES.join(' '),
    code_challenge_method: 'S256',
    code_challenge: codeChallenge
  });

  window.location.href = `https://accounts.spotify.com/authorize?${params.toString()}`;
};

export const exchangeToken = async (code: string) => {
  const codeVerifier = window.localStorage.getItem('pkce_code_verifier');
  if (!codeVerifier) throw new Error('No code verifier found');

  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    grant_type: 'authorization_code',
    code,
    redirect_uri: getRedirectUri(),
    code_verifier: codeVerifier,
  });

  const response = await axios.post('https://accounts.spotify.com/api/token', params, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });
  return response.data;
};

export interface SpotifyDevice {
  id: string;
  name: string;
  type: string;
  is_active: boolean;
  volume_percent: number;
}

export interface SpotifyTrack {
  id: string;
  name: string;
  artist: string;
  preview_url: string | null;
  image?: string;
  uri?: string;
}

export interface SpotifyPlaylist {
  id: string;
  name: string;
  image: string;
  tracks: { total: number };
}

export const getPlaybackState = async (token: string) => {
  try {
    const response = await axios.get('https://api.spotify.com/v1/me/player', {
      headers: { Authorization: `Bearer ${token}` },
      params: { market: 'PL' }
    });
    return response.data;
  } catch {
    return null;
  }
};

export const getAvailableDevices = async (token: string): Promise<SpotifyDevice[]> => {
  const response = await axios.get('https://api.spotify.com/v1/me/player/devices', {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data.devices || [];
};

export const transferPlayback = async (token: string, deviceId: string) => {
  await axios.put(
    'https://api.spotify.com/v1/me/player',
    { device_ids: [deviceId], play: false },
    { headers: { Authorization: `Bearer ${token}` } }
  );
};

export const getUserPlaylists = async (token: string): Promise<SpotifyPlaylist[]> => {
  if (!token) throw new Error('Token required');
  const response = await axios.get('https://api.spotify.com/v1/me/playlists', {
    headers: { Authorization: `Bearer ${token}` },
    params: { limit: 50 }
  });
  return response.data.items.map((item: any) => ({
    id: item.id,
    name: item.name,
    image: item.images?.[0]?.url || '',
    tracks: item.tracks
  }));
};

export const searchPlaylists = async (token: string, query: string): Promise<SpotifyPlaylist[]> => {
  if (!token) throw new Error('Token required');
  const response = await axios.get('https://api.spotify.com/v1/search', {
    headers: { Authorization: `Bearer ${token}` },
    params: { q: query, type: 'playlist', limit: 20, market: 'PL' }
  });
  return response.data.playlists.items.map((item: any) => ({
    id: item.id,
    name: item.name,
    image: item.images?.[0]?.url || '',
    tracks: item.tracks
  }));
};

export const fetchPlaylistTracks = async (token: string, playlistId: string): Promise<SpotifyTrack[]> => {
  if (!token) throw new Error("No token provided");

  let tracks: SpotifyTrack[] = [];
  let nextUrl: string | null = `https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=50&market=PL`;
  let pageCount = 0;
  const MAX_PAGES = 10;

  while (nextUrl && pageCount < MAX_PAGES) {
    const response: any = await axios.get(nextUrl, {
      headers: { Authorization: `Bearer ${token}` }
    });

    for (const item of response.data.items) {
      const track = item.track;
      if (track && !track.is_local) {
        tracks.push({
          id: track.id,
          name: track.name,
          artist: track.artists.map((a: any) => a.name).join(', '),
          preview_url: track.preview_url,
          image: track.album.images?.[0]?.url,
          uri: track.uri
        });
      }
    }

    nextUrl = response.data.next;
    pageCount++;
  }

  if (tracks.length < 4) {
    throw new Error(`Znaleziono tylko ${tracks.length} utworów. Wymagane min. 4!`);
  }

  return tracks;
};

export const playTrack = async (token: string, deviceId: string, trackUri: string, positionMs = 0) => {
  await axios.put(
    `https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`,
    { uris: [trackUri], position_ms: positionMs },
    { headers: { Authorization: `Bearer ${token}` } }
  );
};

export const pausePlayback = async (token: string, deviceId?: string) => {
  const url = deviceId 
    ? `https://api.spotify.com/v1/me/player/pause?device_id=${deviceId}`
    : 'https://api.spotify.com/v1/me/player/pause';
  await axios.put(url, {}, { headers: { Authorization: `Bearer ${token}` } });
};

export const getCurrentUser = async (token: string) => {
  const response = await axios.get('https://api.spotify.com/v1/me', {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};
