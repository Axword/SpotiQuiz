import { create } from 'zustand';
import { SpotifyTrack } from '../lib/spotify';
import { Language } from '../lib/translations';

export type GameMode = 'ABCD' | 'Type' | 'List';
export type RoomType = 'Solo' | 'LocalHost' | 'Online';
export type GameStatus = 'setup' | 'lobby' | 'playing' | 'results';

interface GameState {
  token: string | null;
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
  isGameActive: boolean; // Computed or simplified status
  isRoundActive: boolean;
  
  // Actions
  setToken: (token: string) => void;
  setUser: (user: any) => void;
  setLanguage: (lang: Language) => void;
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
  
  setTracks: (tracks: SpotifyTrack[]) => void;
  startGame: () => void;
  nextRound: () => void;
  addScore: (points: number) => void;
  resetGame: () => void;
}

export const useGameStore = create<GameState>((set) => ({
  token: null,
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
  
  setToken: (token) => set({ token }),
  setUser: (user) => set({ user }),
  setLanguage: (language) => set({ language }),
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
    roomCode: null // Reset room on full reset, or keep it? Usually full reset goes to home.
  })
}));
