import axios from 'axios';

const CLIENT_ID = '7826777c157c43c080e538950ce5346e';
const REDIRECT_URI = 'http://localhost:8080/home'; // Changed to match one of the allowed URIs
const SCOPES = [
  'user-read-private',
  'user-read-email',
  'playlist-read-private',
  'playlist-read-collaborative'
];

export const AUTH_URL = `https://accounts.spotify.com/authorize?client_id=${CLIENT_ID}&response_type=token&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${encodeURIComponent(SCOPES.join(' '))}&show_dialog=true`;

export const getTokenFromUrl = () => {
  return window.location.hash
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
  preview_url: string | null;
  image?: string;
}

export interface SpotifyPlaylist {
  id: string;
  name: string;
  image: string;
  tracks: {
    total: number;
  };
}

// Fallback Mock Data with working previews (hopefully)
// Using standard clear examples if possible, or just a structure that won't crash.
// Note: Many official Spotify preview URLs are 404ing now due to policy changes.
// We will try to filter strictly for valid ones in the real API.
const MOCK_TRACKS: SpotifyTrack[] = [
  {
    id: '1',
    name: 'Blinding Lights',
    artist: 'The Weeknd',
    preview_url: 'https://p.scdn.co/mp3-preview/0d398e09f57f5c7659549f60e909564883907705?cid=7826777c157c43c080e538950ce5346e', 
    image: 'https://i.scdn.co/image/ab67616d0000b2738863bc11d2aa12b54f5aeb36'
  },
  {
    id: '2',
    name: 'Shape of You',
    artist: 'Ed Sheeran',
    preview_url: 'https://p.scdn.co/mp3-preview/7339548839a2633321138b1d018ce3731e646ebc?cid=7826777c157c43c080e538950ce5346e',
    image: 'https://i.scdn.co/image/ab67616d0000b273ba5db46f4b838ef6027e6f96'
  },
  {
    id: '3',
    name: 'Dance Monkey',
    artist: 'Tones And I',
    preview_url: 'https://p.scdn.co/mp3-preview/5443d3b730594e9f9099951860642f4c7d0d046c?cid=7826777c157c43c080e538950ce5346e',
    image: 'https://i.scdn.co/image/ab67616d0000b27311c633a6977e231e5f8f553f'
  },
  {
    id: '4',
    name: 'Levitating',
    artist: 'Dua Lipa',
    preview_url: 'https://p.scdn.co/mp3-preview/0d398e09f57f5c7659549f60e909564883907705?cid=7826777c157c43c080e538950ce5346e', // Reusing valid link for test
    image: 'https://i.scdn.co/image/ab67616d0000b273bd26ede1ae693270054d4803'
  }
];

export const searchPlaylists = async (token: string, query: string): Promise<SpotifyPlaylist[]> => {
  if (!token) return [];
  try {
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

export const getUserPlaylists = async (token: string): Promise<SpotifyPlaylist[]> => {
  if (!token) return [];
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

export const getFeaturedPlaylists = async (token: string): Promise<SpotifyPlaylist[]> => {
  if (!token) return [];
  try {
    const response = await axios.get(`https://api.spotify.com/v1/browse/featured-playlists`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { limit: 10, country: 'PL' }
    });
    return response.data.playlists.items.map((item: any) => ({
      id: item.id,
      name: item.name,
      image: item.images[0]?.url,
      tracks: item.tracks
    }));
  } catch (error) {
    console.error("Error fetching featured playlists", error);
    return [];
  }
};

export const getPlaylistTracks = async (token: string, playlistId: string): Promise<SpotifyTrack[]> => {
  if (!token) return MOCK_TRACKS;
  try {
    let tracks: SpotifyTrack[] = [];
    let nextUrl = `https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=50&market=PL`;
    
    // Fetch up to 150 tracks (3 pages) to find enough previews
    let pages = 0;
    while (nextUrl && pages < 3) {
      const response = await axios.get(nextUrl, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const validTracks = response.data.items
        .map((item: any) => item.track)
        .filter((track: any) => track && track.preview_url) // CRITICAL: Only take tracks with previews
        .map((track: any) => ({
          id: track.id,
          name: track.name,
          artist: track.artists.map((a: any) => a.name).join(', '),
          preview_url: track.preview_url,
          image: track.album.images[0]?.url
        }));
        
      tracks = [...tracks, ...validTracks];
      nextUrl = response.data.next;
      pages++;
    }
    
    return tracks;
  } catch (error) {
    console.error("Error fetching tracks", error);
    return MOCK_TRACKS;
  }
};
