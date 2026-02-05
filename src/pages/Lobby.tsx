import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import Peer, { DataConnection } from 'peerjs';

interface PeerMessage {
  type: 'join' | 'player-list' | 'start-game' | 'game-state' | 'answer' | 'next-round' | 'show-answer';
  payload?: any;
}

export default function Lobby() {
  const navigate = useNavigate();
  const {
    roomCode,
    players,
    isHost,
    userName,
    tracks,
    gameMode,
    roundsCount,
    roundTime,
    roomType,
    setPlayers,
    addPlayer,
    startGame
  } = useGameStore();

  const [copied, setCopied] = useState(false);
  const [connecting, setConnecting] = useState(!isHost);
  const [error, setError] = useState<string | null>(null);
  
  const peerRef = useRef<Peer | null>(null);
  const connectionsRef = useRef<Map<string, DataConnection>>(new Map());

  useEffect(() => {
    if (!roomCode) {
      navigate('/');
      return;
    }

    const peerId = isHost ? `spotify-quiz-${roomCode}` : `spotify-quiz-${roomCode}-${Date.now()}`;
    
    const peer = new Peer(peerId, {
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      }
    });

    peerRef.current = peer;

    peer.on('open', () => {
      if (!isHost) {
        const hostPeerId = `spotify-quiz-${roomCode}`;
        const conn = peer.connect(hostPeerId, { reliable: true });
        
        conn.on('open', () => {
          setConnecting(false);
          conn.send({ type: 'join', payload: { name: userName, id: peerId } } as PeerMessage);
        });

        conn.on('data', (data) => {
          const message = data as PeerMessage;
          handleMessage(message, conn);
        });

        conn.on('error', () => {
          setError('Nie udało się połączyć z hostem');
          setConnecting(false);
        });

        connectionsRef.current.set('host', conn);
      }
    });

    peer.on('connection', (conn) => {
      conn.on('open', () => {
        connectionsRef.current.set(conn.peer, conn);
      });

      conn.on('data', (data) => {
        const message = data as PeerMessage;
        handleMessage(message, conn);
      });

      conn.on('close', () => {
        connectionsRef.current.delete(conn.peer);
      });
    });

    peer.on('error', (err) => {
      console.error('Peer error:', err);
      if (!isHost) {
        setError('Nie udało się połączyć. Sprawdź kod pokoju.');
        setConnecting(false);
      }
    });

    return () => {
      peer.destroy();
    };
  }, [roomCode, isHost, userName]);

  const handleMessage = (message: PeerMessage, _conn: DataConnection) => {
    switch (message.type) {
      case 'join':
        if (isHost) {
          const newPlayer = {
            id: message.payload.id,
            name: message.payload.name,
            score: 0,
            isHost: false
          };
          addPlayer(newPlayer);
          
          setTimeout(() => {
            broadcastToAll({ type: 'player-list', payload: useGameStore.getState().players });
          }, 100);
        }
        break;

      case 'player-list':
        if (!isHost) {
          setPlayers(message.payload);
        }
        break;

      case 'start-game':
        if (!isHost) {
          useGameStore.setState({
            tracks: message.payload.tracks,
            gameMode: message.payload.gameMode,
            roundsCount: message.payload.roundsCount,
            roundTime: message.payload.roundTime,
            roomType: message.payload.roomType
          });
          startGame();
          navigate('/game');
        }
        break;
    }
  };

  const broadcastToAll = (message: PeerMessage) => {
    connectionsRef.current.forEach((conn) => {
      if (conn.open) {
        conn.send(message);
      }
    });
  };

  const handleCopyCode = () => {
    if (roomCode) {
      navigator.clipboard.writeText(roomCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleStartGame = () => {
    if (!isHost || players.length < 1) return;

    broadcastToAll({
      type: 'start-game',
      payload: { tracks, gameMode, roundsCount, roundTime, roomType }
    });

    startGame();
    navigate('/game');
  };

  const handleLeave = () => {
    if (peerRef.current) {
      peerRef.current.destroy();
    }
    navigate('/mode');
  };

  if (connecting) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#1a1a2e] via-[#16213e] to-[#0f0f23] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-400">Łączenie z hostem...</p>
          {error && (
            <div className="mt-4">
              <p className="text-red-400 mb-4">{error}</p>
              <button
                onClick={() => navigate('/join')}
                className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-full"
              >
                Spróbuj ponownie
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a1a2e] via-[#16213e] to-[#0f0f23] p-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <p className="text-gray-400 mb-2">{roomType === 'Party' ? 'Tryb Impreza' : 'Tryb Normalny'}</p>
          <h1 className="text-3xl font-bold text-white mb-6">Poczekalnia</h1>
          
          <div className="inline-flex items-center gap-4 bg-[#2a2a4a] rounded-2xl p-4 border border-white/10">
            <div>
              <p className="text-gray-400 text-sm mb-1">Kod pokoju</p>
              <p className="text-3xl font-mono font-bold text-white tracking-widest">{roomCode}</p>
            </div>
            <button
              onClick={handleCopyCode}
              className={`p-3 rounded-xl transition-all ${
                copied ? 'bg-green-500 text-black' : 'bg-white/10 hover:bg-white/20 text-white'
              }`}
            >
              {copied ? (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              )}
            </button>
          </div>
        </div>

        <div className="bg-[#2a2a4a]/50 rounded-2xl p-6 border border-white/10 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">Gracze ({players.length})</h2>
            {!isHost && (
              <span className="text-sm text-gray-400">Czekam na hosta...</span>
            )}
          </div>

          <div className="space-y-3">
            {players.map((player, index) => (
              <div
                key={player.id}
                className={`flex items-center gap-4 p-4 rounded-xl ${
                  player.isHost ? 'bg-green-500/10 border border-green-500/30' : 'bg-white/5'
                }`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold ${
                  player.isHost ? 'bg-green-500 text-black' : 'bg-purple-500 text-white'
                }`}>
                  {index + 1}
                </div>
                <div className="flex-1">
                  <p className="font-bold text-white">{player.name}</p>
                  {player.isHost && (
                    <p className="text-xs text-green-400">Host</p>
                  )}
                </div>
                {player.name === userName && (
                  <span className="text-xs bg-white/10 text-gray-400 px-2 py-1 rounded-full">Ty</span>
                )}
              </div>
            ))}

            {players.length < 2 && isHost && (
              <div className="text-center py-8 text-gray-500">
                <p>Czekam na graczy...</p>
                <p className="text-sm mt-2">Udostępnij kod pokoju znajomym</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-[#2a2a4a]/30 rounded-xl p-4 mb-6">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-gray-400 text-sm">Rundy</p>
              <p className="text-white font-bold">{roundsCount}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Czas</p>
              <p className="text-white font-bold">{roundTime}s</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Tryb</p>
              <p className="text-white font-bold">{gameMode}</p>
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          <button
            onClick={handleLeave}
            className="flex-1 py-4 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition-all"
          >
            Wyjdź
          </button>
          
          {isHost && (
            <button
              onClick={handleStartGame}
              disabled={players.length < 1}
              className={`flex-1 py-4 font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
                players.length >= 1
                  ? 'bg-green-500 hover:bg-green-400 text-black'
                  : 'bg-gray-700 text-gray-500 cursor-not-allowed'
              }`}
            >
              Rozpocznij grę
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
