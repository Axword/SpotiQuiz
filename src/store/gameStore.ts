import { create } from 'zustand';
import { SpotifyTrack, refreshAccessToken } from '../lib/spotify';
import { Language } from '../lib/translations';

export type GameMode = 'ABCD' | 'Type' | 'List';
export type RoomType = 'Solo' | 'LocalHost' | 'Online';
export type GameStatus = 'setup' | 'lobby' | 'playing' | 'results';

interface GameState {
  token: string | null;
  refreshToken: string | null;
  tokenExpiresAt: number | null;
  user: any | null;
  
  // Settings
  language: Language;
  gameMode: GameMode;
  roomType: RoomType;
  roundsCount: number;
  playlistId: string | null;
  playlistName: string | null;
  
  // Room / Lobby
  roomCode: string | null;
  isHost: boolean;
  gameStatus: GameStatus;

  // Game Progress
  tracks: SpotifyTrack[];
  currentRound: number;
  score: number;
  isGameActive: boolean;
  isRoundActive: boolean;
  
  // Actions
  setToken: (token: string, refreshToken?: string, expiresIn?: number) => void;
  setUser: (user: any) => void;
  setLanguage: (lang: Language) => void;
  getValidToken: () => Promise<string | null>;
  setGameSettings: (settings: { 
    gameMode?: GameMode; 
    roomType?: RoomType;
    roundsCount?: number; 
    playlistId?: string;
    playlistName?: string 
  }) => void;
  
  // Room Actions
  createRoom: () => void;
  joinRoom: (code: string) => void;
  leaveRoom: () => void;
  setIsHost: (isHost: boolean) => void;
  
  setTracks: (tracks: SpotifyTrack[]) => void;
  startGame: () => void;
  nextRound: () => void;
  addScore: (points: number) => void;
  resetGame: () => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  token: null,
  refreshToken: null,
  tokenExpiresAt: null,
  user: null,
  
  language: 'pl',
  gameMode: 'ABCD',
  roomType: 'Solo',
  roundsCount: 10,
  playlistId: null,
  playlistName: null,
  
  roomCode: null,
  isHost: false,
  gameStatus: 'setup',
  
  tracks: [],
  currentRound: 0,
  score: 0,
  isGameActive: false,
  isRoundActive: false,
  
  setToken: (token, refreshToken, expiresIn) => {
    const expiresAt = expiresIn ? Date.now() + expiresIn * 1000 : null;
    set({ token, refreshToken: refreshToken || null, tokenExpiresAt: expiresAt });
    
    // Store tokens in session storage for persistence
    sessionStorage.setItem('spotify_token', token);
    if (refreshToken) {
      sessionStorage.setItem('spotify_refresh_token', refreshToken);
    }
    if (expiresAt) {
      sessionStorage.setItem('spotify_token_expires_at', expiresAt.toString());
    }
  },
  
  setUser: (user) => set({ user }),
  setLanguage: (language) => set({ language }),
  
  getValidToken: async () => {
    const state = get();
    
    // Check if token is still valid
    if (state.token && state.tokenExpiresAt && Date.now() < state.tokenExpiresAt) {
      return state.token;
    }
    
    // Try to refresh token
    if (state.refreshToken) {
      const result = await refreshAccessToken(state.refreshToken);
      if (result) {
        get().setToken(result.access_token, state.refreshToken, result.expires_in);
        return result.access_token;
      }
    }
    
    // No valid token available
    return null;
  },
  
  setGameSettings: (settings) => set((state) => ({ ...state, ...settings })),
  
  createRoom: () => {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    set({ roomCode: code, isHost: true, gameStatus: 'lobby', roomType: 'LocalHost' });
  },
  
  joinRoom: (code) => {
    set({ roomCode: code, isHost: false, gameStatus: 'lobby', roomType: 'Online' });
  },
  
  leaveRoom: () => set({ 
    roomCode: null, 
    isHost: false, 
    gameStatus: 'setup',
    roomType: 'Solo'
  }),
  
  setIsHost: (isHost) => set({ isHost }),

  setTracks: (tracks) => set({ tracks }),
  
  startGame: () => set({ 
    isGameActive: true, 
    gameStatus: 'playing',
    currentRound: 1, 
    score: 0, 
    isRoundActive: true 
  }),
  
  nextRound: () => set((state) => ({ 
    currentRound: state.currentRound + 1,
    isRoundActive: true
  })),
  
  addScore: (points) => set((state) => ({ score: state.score + points })),
  
  resetGame: () => set({
    isGameActive: false,
    gameStatus: 'setup',
    currentRound: 0,
    score: 0,
    isRoundActive: false,
    tracks: [],
    roomCode: null
  })
}));
