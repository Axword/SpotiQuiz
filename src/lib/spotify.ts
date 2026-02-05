import axios from 'axios';

const CLIENT_ID = '7826777c157c43c080e538950ce5346e';
// Dynamic redirect URI handling
const getRedirectUri = () => {
  // Always use local loopback for development to satisfy Spotify's strict security
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://127.0.0.1:8080/callback';
  }
  // Production
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

// PKCE Helpers
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

// Auth Functions
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

  const url = `https://accounts.spotify.com/authorize?${params.toString()}`;
  console.log('Redirecting to Spotify Auth:', url);
  window.location.href = url;
};

export const exchangeToken = async (code: string) => {
  const codeVerifier = window.localStorage.getItem('pkce_code_verifier');

  if (!codeVerifier) {
    throw new Error('No code verifier found');
  }

  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    grant_type: 'authorization_code',
    code,
    redirect_uri: getRedirectUri(),
    code_verifier: codeVerifier,
  });

  try {
    const response = await axios.post('https://accounts.spotify.com/api/token', params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Token exchange failed', error);
    throw error;
  }
};

// Data Types
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
  tracks: {
    total: number;
  };
}

// Real Data Fetching Functions
export const getUserPlaylists = async (token: string): Promise<SpotifyPlaylist[]> => {
  if (!token) throw new Error('Token required');
  const response = await axios.get(`https://api.spotify.com/v1/me/playlists`, {
    headers: { Authorization: `Bearer ${token}` },
    params: { limit: 20 }
  });
  return response.data.items.map((item: any) => ({
    id: item.id,
    name: item.name,
    image: item.images?.[0]?.url,
    tracks: item.tracks
  }));
};

export const getFeaturedPlaylists = async (token?: string): Promise<SpotifyPlaylist[]> => {
  const headers: any = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  const response = await axios.get(`https://api.spotify.com/v1/browse/featured-playlists`, {
    headers,
    params: { limit: 20, country: 'PL', locale: 'pl_PL' }
  });
  return response.data.playlists.items.map((item: any) => ({
    id: item.id,
    name: item.name,
    image: item.images?.[0]?.url,
    tracks: item.tracks
  }));
};

export const searchPlaylists = async (token: string, query: string): Promise<SpotifyPlaylist[]> => {
  if (!token) throw new Error('Token required');
  const response = await axios.get(`https://api.spotify.com/v1/search`, {
    headers: { Authorization: `Bearer ${token}` },
    params: { q: query, type: 'playlist', limit: 10, market: 'PL' }
  });
  return response.data.playlists.items.map((item: any) => ({
    id: item.id,
    name: item.name,
    image: item.images?.[0]?.url,
    tracks: item.tracks
  }));
};

// The core function for fetching playlist tracks (no preview_url requirement)
export const fetchPlaylistTracks = async (token: string, playlistId: string): Promise<SpotifyTrack[]> => {
  if (!token) throw new Error("No token provided");

  let tracks: SpotifyTrack[] = [];
  let nextUrl = `https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=50&market=PL`;
  let pageCount = 0;
  const MAX_PAGES = 10; // Fetch up to 500 tracks

  console.log(`Starting fetch for playlist ${playlistId}`);

  while (nextUrl && pageCount < MAX_PAGES) {
    console.log(`Fetching page ${pageCount + 1}...`);
    try {
      const response = await axios.get(nextUrl, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const items = response.data.items;
      
      for (const item of items) {
        const track = item.track;
        // Use any track that is not local
        if (track && !track.is_local) {
          tracks.push({
            id: track.id,
            name: track.name,
            artist: track.artists.map((a: any) => a.name).join(', '),
            preview_url: track.preview_url, // May be null
            image: track.album.images?.[0]?.url,
            uri: track.uri
          });
        }
      }

      nextUrl = response.data.next;
      pageCount++;
    } catch (error) {
      console.error("Error fetching page:", error);
      break; 
    }
  }

  console.log(`Fetched ${tracks.length} tracks.`);

  if (tracks.length < 4) {
    throw new Error(`Znaleziono tylko ${tracks.length} utworów. To za mało na grę! (Wymagane min. 4)`);
  }

  return tracks;
};

export const playTrack = async (token: string, deviceId: string, trackUri: string) => {
  await axios.put(
    `https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`,
    { uris: [trackUri] },
    { headers: { Authorization: `Bearer ${token}` } }
  );
};
