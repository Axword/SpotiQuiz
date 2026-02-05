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
  allTracks: SpotifyTrack[];
  gameTracks: SpotifyTrack[];
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
  setPlayerAnswered: (playerId: string, answered: boolean) => void;
  allPlayersAnswered: () => boolean;
  
  setGameSettings: (settings: Partial<{ gameMode: GameMode; roundsCount: number; roundTime: number }>) => void;
  setTracks: (tracks: SpotifyTrack[]) => void;
  setGameState: (gameState: { tracks: SpotifyTrack[]; allTracks: SpotifyTrack[]; gameTracks: SpotifyTrack[]; gameMode: GameMode; roundsCount: number; roundTime: number; roomType: RoomType }) => void;
  
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

const shuffleArray = <T>(array: T[]): T[] => {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

const generateOptions = (allTracks: SpotifyTrack[], correctTrack: SpotifyTrack): SpotifyTrack[] => {
  const options = [correctTrack];
  const otherTracks = allTracks.filter(t => t.id !== correctTrack.id);
  const shuffledOthers = shuffleArray(otherTracks);
  
  for (let i = 0; i < Math.min(3, shuffledOthers.length); i++) {
    options.push(shuffledOthers[i]);
  }
  
  return shuffleArray(options);
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
      allTracks: [],
      gameTracks: [],
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
      
      setPlayerAnswered: (playerId, answered) => set((state) => ({
        players: state.players.map(p => 
          p.id === playerId ? { ...p, hasAnswered: answered } : p
        )
      })),
      
      allPlayersAnswered: () => {
        const state = get();
        const nonHostPlayers = state.players.filter(p => !p.isHost);
        if (nonHostPlayers.length === 0) return true;
        return nonHostPlayers.every(p => p.hasAnswered);
      },
      
      setGameSettings: (settings) => set((state) => ({
        gameMode: settings.gameMode ?? state.gameMode,
        roundsCount: settings.roundsCount ?? state.roundsCount,
        roundTime: settings.roundTime ?? state.roundTime
      })),
      setTracks: (tracks) => {
        const shuffledForGame = shuffleArray(tracks);
        const shuffledAllTracks = shuffleArray([...tracks]);
        const allTracksCapped = shuffledAllTracks.length > 200 ? shuffledAllTracks.slice(0, 200) : shuffledAllTracks;
        set({ 
          tracks: shuffledForGame,
          allTracks: allTracksCapped,
          gameTracks: shuffledForGame
        });
      },
      
      setGameState: (gameState: { tracks: SpotifyTrack[]; allTracks: SpotifyTrack[]; gameTracks: SpotifyTrack[]; gameMode: GameMode; roundsCount: number; roundTime: number; roomType: RoomType }) => {
        set({
          tracks: gameState.tracks,
          allTracks: gameState.allTracks,
          gameTracks: gameState.gameTracks,
          gameMode: gameState.gameMode,
          roundsCount: gameState.roundsCount,
          roundTime: gameState.roundTime,
          roomType: gameState.roomType
        });
      },
      
      startGame: () => {
        const state = get();
        const firstTrack = state.gameTracks[0];
        if (!firstTrack) return;
        set({
          currentRound: 1,
          currentTrack: firstTrack,
          options: generateOptions(state.allTracks, firstTrack),
          isPlaying: true,
          roundStartTime: Date.now(),
          showAnswer: false,
          players: state.players.map(p => ({ ...p, hasAnswered: false, score: 0 }))
        });
      },
      
      nextRound: () => {
        const state = get();
        const nextRoundNum = state.currentRound + 1;
        if (nextRoundNum > state.roundsCount || nextRoundNum > state.gameTracks.length) {
          set({ isPlaying: false });
          return;
        }
        const nextTrack = state.gameTracks[nextRoundNum - 1];
        set({
          currentRound: nextRoundNum,
          currentTrack: nextTrack,
          options: generateOptions(state.allTracks, nextTrack),
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
        allTracks: [],
        gameTracks: [],
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
          allTracks: [],
          gameTracks: [],
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
