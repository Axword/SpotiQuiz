import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import { Layout } from '../components/Layout';
import { playGameOverSound } from '../lib/sounds';
import { useEffect } from 'react';

export default function Results() {
  const navigate = useNavigate();
  const { players, roundsCount, currentRound, resetGame, roomType } = useGameStore();
  
  useEffect(() => {
    playGameOverSound();
  }, []);

  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
  const totalRounds = Math.min(roundsCount, currentRound);

  const handlePlayAgain = () => {
    resetGame();
    navigate('/mode');
  };

  const handleHome = () => {
    resetGame();
    navigate('/');
  };

  const getMedalColor = (index: number) => {
    switch (index) {
      case 0: return 'from-yellow-400 to-yellow-600';
      case 1: return 'from-gray-300 to-gray-500';
      case 2: return 'from-amber-600 to-amber-800';
      default: return 'from-gray-600 to-gray-800';
    }
  };

  const getMedalIcon = (index: number) => {
    if (index === 0) {
      return (
        <svg className="w-8 h-8 text-yellow-300" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
        </svg>
      );
    }
    return null;
  };

  return (
    <Layout>
      <div className="min-h-[calc(100vh-64px)] p-4">
        <div className="max-w-2xl mx-auto">
        <div className="text-center mb-10">
          <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center shadow-2xl shadow-yellow-500/30">
            <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 002.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 012.916.52 6.003 6.003 0 01-5.395 4.972m0 0a6.726 6.726 0 01-2.749 1.35m0 0a6.772 6.772 0 01-3.044 0" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Koniec gry!</h1>
          <p className="text-gray-400">
            {roomType === 'Solo' ? `Ukończono ${totalRounds} rund` : `${sortedPlayers.length} graczy • ${totalRounds} rund`}
          </p>
        </div>

        <div className="space-y-4 mb-10">
          {sortedPlayers.map((player, index) => (
            <div
              key={player.id}
              className={`relative flex items-center gap-4 p-5 rounded-2xl transition-all ${
                index === 0 
                  ? 'bg-gradient-to-r from-yellow-500/20 to-yellow-600/10 border-2 border-yellow-500/50' 
                  : index === 1
                  ? 'bg-gradient-to-r from-gray-400/20 to-gray-500/10 border border-gray-400/30'
                  : index === 2
                  ? 'bg-gradient-to-r from-amber-600/20 to-amber-700/10 border border-amber-600/30'
                  : 'bg-white/5 border border-white/10'
              }`}
            >
              <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${getMedalColor(index)} flex items-center justify-center text-xl font-bold text-white shadow-lg`}>
                {index < 3 ? getMedalIcon(index) || (index + 1) : index + 1}
              </div>
              
              <div className="flex-1">
                <p className="font-bold text-white text-lg">{player.name}</p>
                {player.isHost && (
                  <p className="text-xs text-green-400">Host</p>
                )}
              </div>
              
              <div className="text-right">
                <p className={`text-2xl font-bold ${index === 0 ? 'text-yellow-400' : 'text-white'}`}>
                  {player.score}
                </p>
                <p className="text-xs text-gray-400">punktów</p>
              </div>

              {index === 0 && (
                <div className="absolute -top-3 -right-3">
                  <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center shadow-lg animate-bounce">
                    <svg className="w-5 h-5 text-black" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M5 16L3 5L8.5 10L12 4L15.5 10L21 5L19 16H5M19 19C19 19.6 18.6 20 18 20H6C5.4 20 5 19.6 5 19V18H19V19Z" />
                    </svg>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {sortedPlayers.length > 0 && sortedPlayers[0].score > 0 && (
          <div className="bg-[#2a2a4a]/50 rounded-2xl p-6 mb-8 border border-white/10">
            <h3 className="text-lg font-bold text-white mb-4 text-center">Statystyki</h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-3xl font-bold text-green-400">{totalRounds}</p>
                <p className="text-sm text-gray-400">Rund</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-blue-400">
                  {sortedPlayers.reduce((sum, p) => sum + p.score, 0)}
                </p>
                <p className="text-sm text-gray-400">Suma punktów</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-purple-400">
                  {Math.round(sortedPlayers.reduce((sum, p) => sum + p.score, 0) / sortedPlayers.length)}
                </p>
                <p className="text-sm text-gray-400">Średnia</p>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-4">
          <button
            onClick={handleHome}
            className="flex-1 py-4 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition-all"
          >
            Strona główna
          </button>
          <button
            onClick={handlePlayAgain}
            className="flex-1 py-4 bg-green-500 hover:bg-green-400 text-black font-bold rounded-xl transition-all flex items-center justify-center gap-2"
          >
            Zagraj ponownie
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
        </div>
      </div>
    </Layout>
  );
}
