import { create } from 'zustand';
import { SpotifyTrack } from '../lib/spotify';

export type GameMode = 'ABCD' | 'Type' | 'List';
export type RoomType = 'Solo' | 'LocalHost' | 'Online';

interface GameState {
  token: string | null;
  user: any | null;
  
  // Settings
  gameMode: GameMode;
  roomType: RoomType;
  roundsCount: number;
  playlistId: string | null;
  playlistName: string | null;
  
  // Game Progress
  tracks: SpotifyTrack[];
  currentRound: number;
  score: number;
  isGameActive: boolean;
  isRoundActive: boolean;
  
  // Actions
  setToken: (token: string) => void;
  setUser: (user: any) => void;
  setGameSettings: (settings: { 
    gameMode?: GameMode; 
    roomType?: RoomType;
    roundsCount?: number; 
    playlistId?: string;
    playlistName?: string 
  }) => void;
  setTracks: (tracks: SpotifyTrack[]) => void;
  startGame: () => void;
  nextRound: () => void;
  addScore: (points: number) => void;
  resetGame: () => void;
}

export const useGameStore = create<GameState>((set) => ({
  token: null,
  user: null,
  
  gameMode: 'ABCD',
  roomType: 'Solo',
  roundsCount: 10,
  playlistId: null,
  playlistName: null,
  
  tracks: [],
  currentRound: 0,
  score: 0,
  isGameActive: false,
  isRoundActive: false,
  
  setToken: (token) => set({ token }),
  setUser: (user) => set({ user }),
  setGameSettings: (settings) => set((state) => ({ ...state, ...settings })),
  setTracks: (tracks) => set({ tracks }),
  
  startGame: () => set({ 
    isGameActive: true, 
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
    currentRound: 0,
    score: 0,
    isRoundActive: false,
    tracks: []
  })
}));
