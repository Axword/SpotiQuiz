import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';

export default function ModeSelect() {
  const navigate = useNavigate();
  const { token, setRoomType, setIsHost, logout } = useGameStore();

  const handleSolo = () => {
    setRoomType('Solo');
    setIsHost(true);
    navigate('/setup');
  };

  const handleCreateParty = () => {
    setRoomType('Party');
    setIsHost(true);
    navigate('/setup');
  };

  const handleCreateNormal = () => {
    setRoomType('Normal');
    setIsHost(true);
    navigate('/setup');
  };

  const handleJoin = () => {
    navigate('/join');
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (!token) {
    navigate('/');
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a1a2e] via-[#16213e] to-[#0f0f23] flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-white mb-3">Wybierz tryb gry</h1>
          <p className="text-gray-400">Co chcesz dzisiaj robić?</p>
        </div>

        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <button
            onClick={handleSolo}
            className="p-6 bg-gradient-to-br from-blue-600/20 to-blue-800/20 hover:from-blue-600/30 hover:to-blue-800/30 border border-blue-500/30 rounded-2xl text-left transition-all group"
          >
            <div className="w-14 h-14 mb-4 bg-blue-500/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <svg className="w-7 h-7 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Solo</h3>
            <p className="text-gray-400 text-sm">Graj sam i testuj swoją wiedzę muzyczną</p>
          </button>

          <button
            onClick={handleJoin}
            className="p-6 bg-gradient-to-br from-purple-600/20 to-purple-800/20 hover:from-purple-600/30 hover:to-purple-800/30 border border-purple-500/30 rounded-2xl text-left transition-all group"
          >
            <div className="w-14 h-14 mb-4 bg-purple-500/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <svg className="w-7 h-7 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Dołącz do gry</h3>
            <p className="text-gray-400 text-sm">Wpisz kod i dołącz do znajomych</p>
          </button>
        </div>

        <div className="bg-[#2a2a4a]/50 rounded-2xl p-6 border border-white/10">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Stwórz pokój
          </h3>
          
          <div className="grid md:grid-cols-2 gap-4">
            <button
              onClick={handleCreateParty}
              className="p-4 bg-gradient-to-br from-pink-600/20 to-red-800/20 hover:from-pink-600/30 hover:to-red-800/30 border border-pink-500/30 rounded-xl text-left transition-all"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-pink-500/20 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-pink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                  </svg>
                </div>
                <h4 className="font-bold text-white">Tryb Impreza</h4>
              </div>
              <p className="text-gray-400 text-sm">
                Tylko host odtwarza muzykę - idealne na głośnik
              </p>
            </button>

            <button
              onClick={handleCreateNormal}
              className="p-4 bg-gradient-to-br from-cyan-600/20 to-teal-800/20 hover:from-cyan-600/30 hover:to-teal-800/30 border border-cyan-500/30 rounded-xl text-left transition-all"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-cyan-500/20 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h4 className="font-bold text-white">Tryb Normalny</h4>
              </div>
              <p className="text-gray-400 text-sm">
                Każdy gracz słucha na swoim Spotify
              </p>
            </button>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full mt-8 py-3 text-gray-500 hover:text-red-400 transition-colors flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Wyloguj się
        </button>
      </div>
    </div>
  );
}
