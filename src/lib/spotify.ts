import axios from 'axios';

const CLIENT_ID = '7826777c157c43c080e538950ce5346e';
const REDIRECT_URI = `${window.location.origin}/home`;
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:8000';

const SCOPES = [
  'user-read-private',
  'user-read-email',
  'playlist-read-private',
  'playlist-read-collaborative'
];

// PKCE: Generate code verifier (43-128 characters from allowed set)
const generateCodeVerifier = (): string => {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  const length = 64; // Use 64 for good entropy
  const values = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(values, (byte) => possible[byte % possible.length]).join('');
};

// PKCE: Generate code challenge
const generateCodeChallenge = async (codeVerifier: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(codeVerifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  const base64 = btoa(String.fromCharCode(...new Uint8Array(digest)));
  return base64
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
};

// Store code verifier in session storage
const storeCodeVerifier = (verifier: string) => {
  sessionStorage.setItem('spotify_code_verifier', verifier);
};

const getCodeVerifier = (): string | null => {
  return sessionStorage.getItem('spotify_code_verifier');
};

const clearCodeVerifier = () => {
  sessionStorage.removeItem('spotify_code_verifier');
};

// Extract playlist ID from Spotify URL
export const extractPlaylistIdFromUrl = (url: string): string | null => {
  try {
    // Handle different Spotify URL formats:
    // https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M
    // spotify:playlist:37i9dQZF1DXcBWIGoYBM5M
    // Just the ID: 37i9dQZF1DXcBWIGoYBM5M
    
    // If it's just an ID
    if (url.length === 22 && !url.includes('/') && !url.includes(':')) {
      return url;
    }
    
    // If it's a spotify URI
    if (url.startsWith('spotify:playlist:')) {
      return url.split(':')[2];
    }
    
    // If it's a URL
    const urlObj = new URL(url);
    const match = urlObj.pathname.match(/\/playlist\/([a-zA-Z0-9]+)/);
    if (match) {
      return match[1];
    }
    
    return null;
  } catch {
    return null;
  }
};

// Generate Authorization URL with PKCE
export const generateAuthURL = async (): Promise<string> => {
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = await generateCodeChallenge(codeVerifier);
  storeCodeVerifier(codeVerifier);

  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: 'code',
    redirect_uri: REDIRECT_URI,
    scope: SCOPES.join(' '),
    code_challenge_method: 'S256',
    code_challenge: codeChallenge,
    show_dialog: 'true'
  });

  return `https://accounts.spotify.com/authorize?${params.toString()}`;
};

// Exchange authorization code for access token
export const exchangeCodeForToken = async (code: string): Promise<{ access_token: string; refresh_token?: string; expires_in: number } | null> => {
  const codeVerifier = getCodeVerifier();
  
  if (!codeVerifier) {
    console.error('Code verifier not found');
    return null;
  }

  try {
    const response = await axios.post(
      'https://accounts.spotify.com/api/token',
      new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: REDIRECT_URI,
        client_id: CLIENT_ID,
        code_verifier: codeVerifier
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    clearCodeVerifier();
    return {
      access_token: response.data.access_token,
      refresh_token: response.data.refresh_token,
      expires_in: response.data.expires_in
    };
  } catch (error) {
    console.error('Error exchanging code for token:', error);
    return null;
  }
};

// Refresh access token
export const refreshAccessToken = async (refreshToken: string): Promise<{ access_token: string; expires_in: number } | null> => {
  try {
    const response = await axios.post(
      'https://accounts.spotify.com/api/token',
      new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: CLIENT_ID
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    return {
      access_token: response.data.access_token,
      expires_in: response.data.expires_in
    };
  } catch (error) {
    console.error('Error refreshing token:', error);
    return null;
  }
};

export const getTokenFromUrl = () => {
  return window.location.search
    .substring(1)
    .split('&')
    .reduce((initial: any, item) => {
      let parts = item.split('=');
      initial[parts[0]] = decodeURIComponent(parts[1]);
      return initial;
    }, {});
};

export interface SpotifyTrack {
  id: string;
  name: string;
  artist: string;
  image?: string;
  uri: string;  // For Web Playback SDK
}

export interface SpotifyPlaylist {
  id: string;
  name: string;
  image: string;
  tracks: {
    total: number;
  };
}

// No mock data - always fetch real data from backend or Spotify API

export const searchPlaylists = async (token: string | null, query: string): Promise<SpotifyPlaylist[]> => {
  try {
    // Use backend for public search (works without token)
    if (!token) {
      const response = await axios.get(`${BACKEND_URL}/api/search/playlists`, {
        params: { q: query, limit: 10 }
      });
      return response.data.playlists || [];
    }

    // Use Spotify API directly for user search (requires token)
    const response = await axios.get(`https://api.spotify.com/v1/search`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { q: query, type: 'playlist', limit: 10, market: 'PL' }
    });
    return response.data.playlists.items.map((item: any) => ({
      id: item.id,
      name: item.name,
      image: item.images[0]?.url,
      tracks: item.tracks
    }));
  } catch (error) {
    console.error("Error searching playlists", error);
    return [];
  }
};

export const getUserPlaylists = async (token: string | null): Promise<SpotifyPlaylist[]> => {
  if (!token) {
    // Return featured playlists from backend for guests
    try {
      const response = await axios.get(`${BACKEND_URL}/api/public-playlists`, {
        params: { limit: 20 }
      });
      return response.data.playlists || [];
    } catch (error) {
      console.error("Error fetching featured playlists", error);
      return [];
    }
  }

  try {
    const response = await axios.get(`https://api.spotify.com/v1/me/playlists`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { limit: 20 }
    });
    return response.data.items.map((item: any) => ({
      id: item.id,
      name: item.name,
      image: item.images[0]?.url,
      tracks: item.tracks
    }));
  } catch (error) {
    console.error("Error fetching user playlists", error);
    return [];
  }
};

export const getFeaturedPlaylists = async (token: string | null): Promise<SpotifyPlaylist[]> => {
  console.log('[getFeaturedPlaylists] Starting with token:', !!token);
  try {
    // Use backend for featured playlists (works without user token)
    console.log('[getFeaturedPlaylists] Fetching from backend:', BACKEND_URL);
    const response = await axios.get(`${BACKEND_URL}/api/public-playlists`, {
      params: { limit: 20 }
    });
    console.log('[getFeaturedPlaylists] Got response:', response.data.playlists?.length || 0, 'playlists');
    return response.data.playlists || [];
  } catch (error) {
    console.error("Error fetching featured playlists", error);
    return [];
  }
};

export const getPlaylistTracks = async (token: string | null, playlistId: string): Promise<SpotifyTrack[]> => {
  console.log('[getPlaylistTracks] Starting with playlistId:', playlistId, 'token:', !!token);
  
  if (!token) {
    throw new Error('Authentication required to fetch playlist tracks');
  }

  // If logged in, try Spotify API directly
  try {
    console.log('[getPlaylistTracks] Using Spotify API directly with user token');
    let tracks: SpotifyTrack[] = [];
    let nextUrl = `https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=50&market=US`;
    
    let pages = 0;
    while (nextUrl && pages < 10) {
      const response = await axios.get(nextUrl, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const validTracks = response.data.items
        .map((item: any) => item.track)
        .filter((track: any) => track)
        .map((track: any) => ({
          id: track.id,
          name: track.name,
          artist: track.artists.map((a: any) => a.name).join(', '),
          uri: track.uri,
          image: track.album.images[0]?.url
        }));
        
      tracks = [...tracks, ...validTracks];
      nextUrl = response.data.next;
      pages++;
      console.log('[getPlaylistTracks] Page', pages, 'got', validTracks.length, 'tracks');
    }
    
    console.log('[getPlaylistTracks] Total tracks from Spotify:', tracks.length);
    return tracks;
  } catch (error) {
    console.error("Error fetching tracks from Spotify API:", error);
    throw error;
  }
};
