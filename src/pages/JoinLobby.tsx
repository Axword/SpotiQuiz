import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';

export default function JoinLobby() {
  const navigate = useNavigate();
  const { setUserName, setRoomCode, setIsHost, addPlayer, token } = useGameStore();
  
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleJoin = async () => {
    if (!name.trim()) {
      setError('Podaj swoją nazwę');
      return;
    }
    if (!code.trim() || code.length < 5) {
      setError('Podaj prawidłowy kod pokoju');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      setUserName(name);
      setRoomCode(code.toUpperCase());
      setIsHost(false);
      const playerId = `player-${Date.now()}`;
      addPlayer({ id: playerId, name, score: 0, isHost: false });
      navigate('/lobby');
    } catch (err) {
      console.error(err);
      setError('Nie udało się dołączyć do pokoju');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a1a2e] via-[#16213e] to-[#0f0f23] flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <button
          onClick={() => navigate(token ? '/mode' : '/')}
          className="mb-6 flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Wróć
        </button>

        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-4 bg-purple-500/20 rounded-2xl flex items-center justify-center">
            <svg className="w-10 h-10 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Dołącz do gry</h1>
          <p className="text-gray-400">Wpisz kod od hosta i dołącz do zabawy!</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Twoja nazwa</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Jak się nazywasz?"
              className="w-full px-4 py-4 bg-[#2a2a4a] border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors text-lg"
              maxLength={20}
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Kod pokoju</label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="XXXXX"
              className="w-full px-4 py-4 bg-[#2a2a4a] border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors text-lg text-center font-mono tracking-widest"
              maxLength={5}
            />
          </div>

          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm text-center">
              {error}
            </div>
          )}

          <button
            onClick={handleJoin}
            disabled={loading}
            className="w-full py-4 bg-purple-500 hover:bg-purple-400 text-white font-bold text-lg rounded-xl transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                Dołącz
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </>
            )}
          </button>
        </div>

        {!token && (
          <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
            <p className="text-yellow-400 text-sm text-center">
              W trybie Impreza nie potrzebujesz konta Spotify - host odtwarza muzykę za wszystkich!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
