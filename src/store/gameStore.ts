import { create } from 'zustand';
import { SpotifyTrack } from '../lib/spotify';
import { Language } from '../lib/translations';
import { Peer } from 'peerjs';

export type GameMode = 'ABCD' | 'Type' | 'List';
export type RoomType = 'Solo' | 'LocalHost' | 'Online';
export type GameStatus = 'setup' | 'lobby' | 'playing' | 'results';

interface GameState {
  token: string | null;
  user: any | null;
  language: Language;
  gameMode: GameMode;
  roomType: RoomType;
  roundsCount: number;
  playlistId: string | null;
  playlistName: string | null;
  roomCode: string | null;
  isHost: boolean;
  gameStatus: GameStatus;
  players: string[];
  nickname: string;
  tracks: SpotifyTrack[];
  currentRound: number;
  score: number;
  isGameActive: boolean;
  isRoundActive: boolean;
  peer: Peer | null;
  connections: Record<string, any>;
  localPeerId: string | null;
  remotePeers: string[];
  
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
  createRoom: () => void;
  joinRoom: (code: string) => void;
  leaveRoom: () => void;
  setPlayers: (players: string[] | ((prev: string[]) => string[])) => void;
  setNickname: (nickname: string) => void;
  setTracks: (tracks: SpotifyTrack[]) => void;
  startGame: () => void;
  nextRound: () => void;
  addScore: (points: number) => void;
  resetGame: () => void;
  initPeer: () => void;
  connectToPeer: (peerId: string) => void;
  broadcastMessage: (type: string, data: any) => void;
  handlePeerMessage: (peerId: string, data: any) => void;
  cleanupPeer: () => void;
}

export const useGameStore = create<GameState>((set, get) => ({
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
  players: [],
  nickname: '',
  tracks: [],
  currentRound: 0,
  score: 0,
  isGameActive: false,
  isRoundActive: false,
  peer: null,
  connections: {},
  localPeerId: null,
  remotePeers: [],
  
  setToken: (token) => set({ token }),
  setUser: (user) => set({ user }),
  setLanguage: (language) => set({ language }),
  setGameSettings: (settings) => set((state) => ({ ...state, ...settings })),
  
  createRoom: () => {
    const code = Math.random().toString(36).substring(2, 7).toUpperCase();
    set({ roomCode: code, isHost: true, gameStatus: 'lobby', roomType: 'LocalHost', players: ['Host (Ty)'] });
  },

  joinRoom: (code) => {
    set((state) => ({ roomCode: code, isHost: false, gameStatus: 'lobby', roomType: 'Online', players: [...state.players, state.nickname || 'Ty'] }));
  },
  
  leaveRoom: () => {
    get().cleanupPeer();
    set({ 
      roomCode: null, 
      isHost: false, 
      gameStatus: 'setup',
      roomType: 'Solo',
      players: [],
      nickname: '',
      remotePeers: [],
      connections: {}
    });
  },
  
  setPlayers: (players) => set((state) => ({ 
    players: typeof players === 'function' ? players(state.players) : players 
  })),
  
  setNickname: (nickname) => set({ nickname }),
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
  
  resetGame: () => {
    get().cleanupPeer();
    set({
      isGameActive: false,
      gameStatus: 'setup',
      currentRound: 0,
      score: 0,
      isRoundActive: false,
      tracks: [],
      roomCode: null,
      remotePeers: [],
      connections: {}
    });
  },

  initPeer: () => {
    const peer = new Peer();
    peer.on('open', (id: string) => {
      set({ localPeerId: id });
      if (get().isHost) {
      } else {
        const hostId = get().roomCode;
        if (hostId) {
          get().connectToPeer(hostId);
        }
      }
    });

    peer.on('connection', (conn: any) => {
      conn.on('open', () => {
        set((state) => ({
          connections: { ...state.connections, [conn.peer]: conn },
          remotePeers: [...state.remotePeers, conn.peer]
        }));
        get().broadcastMessage('player_joined', { nickname: get().nickname });
      });
      
      conn.on('data', (data: any) => {
        get().handlePeerMessage(conn.peer, data);
      });
    });

    set({ peer });
  },

  connectToPeer: (peerId) => {
    const { peer, nickname } = get();
    if (!peer) return;
    
    const conn = peer.connect(peerId);
    conn.on('open', () => {
      set((state) => ({
        connections: { ...state.connections, [peerId]: conn }
      }));
      conn.send({ type: 'player_joined', data: { nickname } });
    });
    
    conn.on('data', (data: any) => {
      get().handlePeerMessage(peerId, data);
    });
  },

  broadcastMessage: (type, data) => {
    const { connections, isHost } = get();
    const message = { type, data, timestamp: Date.now() };
    
    Object.values(connections).forEach(conn => {
      try {
        conn.send(message);
      } catch (e) {
        console.error('Failed to send message:', e);
      }
    });
    
    if (isHost) {
      get().handlePeerMessage('self', message);
    }
  },

  handlePeerMessage: (peerId, data) => {
    const { type, data: payload } = data;
    
    switch (type) {
      case 'player_joined':
        set((state) => ({
          players: [...state.players, payload.nickname]
        }));
        break;
      case 'start_game':
        set({ gameStatus: 'playing', currentRound: 1, score: 0, isGameActive: true });
        break;
      case 'next_round':
        set((state) => ({ currentRound: state.currentRound + 1 }));
        break;
      case 'player_answer':
        break;
      default:
        break;
    }
  },

  cleanupPeer: () => {
    const { peer, connections } = get();
    
    Object.values(connections).forEach(conn => {
      try {
        conn.close();
      } catch (e) {
        console.error('Error closing connection:', e);
      }
    });
    
    if (peer) {
      try {
        peer.destroy();
      } catch (e) {
        console.error('Error destroying peer:', e);
      }
    }
    
    set({ peer: null, connections: {}, localPeerId: null, remotePeers: [] });
  }
}));
