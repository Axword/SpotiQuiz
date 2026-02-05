import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { SpotifyTrack, SpotifyDevice } from '../lib/spotify';

export type GameMode = 'ABCD' | 'Type' | 'List';
export type RoomType = 'Solo' | 'Party' | 'Normal';

export interface Player {
  id: string;
  name: string;
  score: number;
  isHost: boolean;
  hasAnswered?: boolean;
  lastAnswerCorrect?: boolean;
  lastAnswerTime?: number;
}

interface GameState {
  token: string | null;
  deviceId: string | null;
  devices: SpotifyDevice[];
  userName: string;
  
  roomType: RoomType;
  roomCode: string | null;
  players: Player[];
  isHost: boolean;
  
  gameMode: GameMode;
  roundsCount: number;
  roundTime: number;
  
  tracks: SpotifyTrack[];
  currentRound: number;
  currentTrack: SpotifyTrack | null;
  options: SpotifyTrack[];
  isPlaying: boolean;
  roundStartTime: number | null;
  showAnswer: boolean;
  
  setToken: (token: string | null) => void;
  setDeviceId: (deviceId: string | null) => void;
  setDevices: (devices: SpotifyDevice[]) => void;
  setUserName: (name: string) => void;
  setRoomType: (type: RoomType) => void;
  setRoomCode: (code: string | null) => void;
  setPlayers: (players: Player[]) => void;
  addPlayer: (player: Player) => void;
  removePlayer: (id: string) => void;
  updatePlayerScore: (id: string, score: number) => void;
  setIsHost: (isHost: boolean) => void;
  
  setGameSettings: (settings: Partial<{ gameMode: GameMode; roundsCount: number; roundTime: number }>) => void;
  setTracks: (tracks: SpotifyTrack[]) => void;
  
  startGame: () => void;
  nextRound: () => void;
  setShowAnswer: (show: boolean) => void;
  submitAnswer: (playerId: string, correct: boolean, timeMs: number) => number;
  resetGame: () => void;
  logout: () => void;
  
  generateRoomCode: () => string;
}

const generateCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 5; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
};

const generateOptions = (tracks: SpotifyTrack[], correctTrack: SpotifyTrack): SpotifyTrack[] => {
  const options = [correctTrack];
  const otherTracks = tracks.filter(t => t.id !== correctTrack.id);
  
  while (options.length < 4 && otherTracks.length > 0) {
    const randomIndex = Math.floor(Math.random() * otherTracks.length);
    options.push(otherTracks.splice(randomIndex, 1)[0]);
  }
  
  return options.sort(() => Math.random() - 0.5);
};

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      token: null,
      deviceId: null,
      devices: [],
      userName: '',
      
      roomType: 'Solo',
      roomCode: null,
      players: [],
      isHost: false,
      
      gameMode: 'ABCD',
      roundsCount: 10,
      roundTime: 30,
      
      tracks: [],
      currentRound: 0,
      currentTrack: null,
      options: [],
      isPlaying: false,
      roundStartTime: null,
      showAnswer: false,
      
      setToken: (token) => set({ token }),
      setDeviceId: (deviceId) => set({ deviceId }),
      setDevices: (devices) => set({ devices }),
      setUserName: (name) => set({ userName: name }),
      setRoomType: (type) => set({ roomType: type }),
      setRoomCode: (code) => set({ roomCode: code }),
      setPlayers: (players) => set({ players }),
      addPlayer: (player) => set((state) => ({ players: [...state.players, player] })),
      removePlayer: (id) => set((state) => ({ players: state.players.filter(p => p.id !== id) })),
      updatePlayerScore: (id, score) => set((state) => ({
        players: state.players.map(p => p.id === id ? { ...p, score } : p)
      })),
      setIsHost: (isHost) => set({ isHost }),
      
      setGameSettings: (settings) => set((state) => ({
        gameMode: settings.gameMode ?? state.gameMode,
        roundsCount: settings.roundsCount ?? state.roundsCount,
        roundTime: settings.roundTime ?? state.roundTime
      })),
      setTracks: (tracks) => set({ tracks }),
      
      startGame: () => {
        const state = get();
        const shuffledTracks = [...state.tracks].sort(() => Math.random() - 0.5);
        const firstTrack = shuffledTracks[0];
        set({
          tracks: shuffledTracks,
          currentRound: 1,
          currentTrack: firstTrack,
          options: generateOptions(shuffledTracks, firstTrack),
          isPlaying: true,
          roundStartTime: Date.now(),
          showAnswer: false,
          players: state.players.map(p => ({ ...p, hasAnswered: false }))
        });
      },
      
      nextRound: () => {
        const state = get();
        const nextRoundNum = state.currentRound + 1;
        if (nextRoundNum > state.roundsCount || nextRoundNum > state.tracks.length) {
          set({ isPlaying: false });
          return;
        }
        const nextTrack = state.tracks[nextRoundNum - 1];
        set({
          currentRound: nextRoundNum,
          currentTrack: nextTrack,
          options: generateOptions(state.tracks, nextTrack),
          roundStartTime: Date.now(),
          showAnswer: false,
          players: state.players.map(p => ({ ...p, hasAnswered: false, lastAnswerCorrect: undefined, lastAnswerTime: undefined }))
        });
      },
      
      setShowAnswer: (show) => set({ showAnswer: show }),
      
      submitAnswer: (playerId, correct, timeMs) => {
        const state = get();
        let points = 0;
        if (correct) {
          const maxPoints = 1000;
          const minPoints = 100;
          const maxTime = state.roundTime * 1000;
          points = Math.max(minPoints, Math.round(maxPoints - (timeMs / maxTime) * (maxPoints - minPoints)));
        }
        set({
          players: state.players.map(p => 
            p.id === playerId 
              ? { ...p, score: p.score + points, hasAnswered: true, lastAnswerCorrect: correct, lastAnswerTime: timeMs }
              : p
          )
        });
        return points;
      },
      
      resetGame: () => set({
        tracks: [],
        currentRound: 0,
        currentTrack: null,
        options: [],
        isPlaying: false,
        roundStartTime: null,
        showAnswer: false,
        players: []
      }),
      
      logout: () => {
        localStorage.removeItem('pkce_code_verifier');
        set({
          token: null,
          deviceId: null,
          devices: [],
          userName: '',
          roomType: 'Solo',
          roomCode: null,
          players: [],
          isHost: false,
          tracks: [],
          currentRound: 0,
          currentTrack: null,
          options: [],
          isPlaying: false
        });
      },
      
      generateRoomCode: () => {
        const code = generateCode();
        set({ roomCode: code });
        return code;
      }
    }),
    {
      name: 'spotify-quiz-store',
      partialize: (state) => ({ token: state.token, userName: state.userName })
    }
  )
);
