import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import { getUserPlaylists, searchPlaylists, fetchPlaylistTracks, SpotifyPlaylist } from '../lib/spotify';

export default function Setup() {
  const navigate = useNavigate();
  const { 
    token, 
    roomType,
    gameMode,
    roundsCount,
    roundTime,
    userName,
    setTracks,
    setGameSettings,
    setUserName,
    setPlayers,
    setIsHost,
    generateRoomCode,
    startGame
  } = useGameStore();

  const [activeTab, setActiveTab] = useState<'my' | 'search'>('my');
  const [query, setQuery] = useState('');
  const [playlists, setPlaylists] = useState<SpotifyPlaylist[]>([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState<SpotifyPlaylist | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingPlaylists, setLoadingPlaylists] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hostName, setHostName] = useState(userName || '');

  useEffect(() => {
    if (!token) {
      navigate('/');
      return;
    }
    loadPlaylists();
  }, [token, activeTab]);

  const loadPlaylists = async () => {
    if (!token) return;
    setLoadingPlaylists(true);
    try {
      if (activeTab === 'my') {
        const result = await getUserPlaylists(token);
        setPlaylists(result);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingPlaylists(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !query.trim()) return;
    
    setLoadingPlaylists(true);
    try {
      const result = await searchPlaylists(token, query);
      setPlaylists(result);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingPlaylists(false);
    }
  };

  const handleStartGame = async () => {
    if (!selectedPlaylist || !token) return;
    if (roomType !== 'Solo' && !hostName.trim()) {
      setError('Podaj swoją nazwę');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const tracks = await fetchPlaylistTracks(token, selectedPlaylist.id);
      
      if (tracks.length < roundsCount) {
        setGameSettings({ roundsCount: tracks.length });
      }

      const shuffledTracks = tracks.sort(() => Math.random() - 0.5);
      setTracks(shuffledTracks);

      if (roomType === 'Solo') {
        setUserName('Gracz');
        setPlayers([{ id: 'solo', name: 'Gracz', score: 0, isHost: true }]);
        setIsHost(true);
        startGame();
        navigate('/game');
      } else {
        setUserName(hostName);
        const playerId = `host-${Date.now()}`;
        setPlayers([{ id: playerId, name: hostName, score: 0, isHost: true }]);
        setIsHost(true);
        generateRoomCode();
        navigate('/lobby');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Wystąpił błąd');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a1a2e] via-[#16213e] to-[#0f0f23] p-4">
      <div className="max-w-6xl mx-auto">
        <button
          onClick={() => navigate('/mode')}
          className="mb-6 flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Wróć
        </button>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-white mb-2">
                {roomType === 'Solo' ? 'Gra Solo' : roomType === 'Party' ? 'Tryb Impreza' : 'Tryb Normalny'}
              </h1>
              <p className="text-gray-400 text-sm">
                {roomType === 'Solo' 
                  ? 'Wybierz playlistę i ustawienia gry'
                  : roomType === 'Party'
                  ? 'Tylko Ty będziesz odtwarzać muzykę'
                  : 'Każdy gracz słucha na swoim urządzeniu'}
              </p>
            </div>

            {roomType !== 'Solo' && (
              <div>
                <label className="block text-sm text-gray-400 mb-2">Twoja nazwa</label>
                <input
                  type="text"
                  value={hostName}
                  onChange={(e) => setHostName(e.target.value)}
                  placeholder="Wpisz swoją nazwę..."
                  className="w-full px-4 py-3 bg-[#2a2a4a] border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-green-500 transition-colors"
                  maxLength={20}
                />
              </div>
            )}

            <div>
              <label className="block text-sm text-gray-400 mb-3">Liczba rund</label>
              <div className="grid grid-cols-4 gap-2">
                {[5, 10, 15, 20].map(count => (
                  <button
                    key={count}
                    onClick={() => setGameSettings({ roundsCount: count })}
                    className={`py-3 rounded-xl font-bold transition-all ${
                      roundsCount === count 
                        ? 'bg-green-500 text-black' 
                        : 'bg-[#2a2a4a] text-gray-400 hover:bg-[#3a3a5a]'
                    }`}
                  >
                    {count}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-3">Czas na odpowiedź</label>
              <div className="grid grid-cols-4 gap-2">
                {[15, 20, 30, 45].map(time => (
                  <button
                    key={time}
                    onClick={() => setGameSettings({ roundTime: time })}
                    className={`py-3 rounded-xl font-bold transition-all ${
                      roundTime === time 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-[#2a2a4a] text-gray-400 hover:bg-[#3a3a5a]'
                    }`}
                  >
                    {time}s
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-3">Tryb gry</label>
              <div className="space-y-2">
                <button
                  onClick={() => setGameSettings({ gameMode: 'ABCD' })}
                  className={`w-full p-4 rounded-xl text-left transition-all flex items-center gap-4 ${
                    gameMode === 'ABCD'
                      ? 'bg-purple-500/20 border-2 border-purple-500'
                      : 'bg-[#2a2a4a] border-2 border-transparent hover:border-white/20'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${gameMode === 'ABCD' ? 'bg-purple-500' : 'bg-gray-700'}`}>
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-bold text-white">ABCD</p>
                    <p className="text-sm text-gray-400">Wybierz z 4 opcji</p>
                  </div>
                </button>

                <button
                  onClick={() => setGameSettings({ gameMode: 'Type' })}
                  className={`w-full p-4 rounded-xl text-left transition-all flex items-center gap-4 ${
                    gameMode === 'Type'
                      ? 'bg-blue-500/20 border-2 border-blue-500'
                      : 'bg-[#2a2a4a] border-2 border-transparent hover:border-white/20'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${gameMode === 'Type' ? 'bg-blue-500' : 'bg-gray-700'}`}>
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-bold text-white">Wpisywanie</p>
                    <p className="text-sm text-gray-400">Wpisz tytuł utworu</p>
                  </div>
                </button>

                <button
                  onClick={() => setGameSettings({ gameMode: 'List' })}
                  className={`w-full p-4 rounded-xl text-left transition-all flex items-center gap-4 ${
                    gameMode === 'List'
                      ? 'bg-yellow-500/20 border-2 border-yellow-500'
                      : 'bg-[#2a2a4a] border-2 border-transparent hover:border-white/20'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${gameMode === 'List' ? 'bg-yellow-500' : 'bg-gray-700'}`}>
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-bold text-white">Lista</p>
                    <p className="text-sm text-gray-400">Wybierz z listy wszystkich utworów</p>
                  </div>
                </button>
              </div>
            </div>

            {selectedPlaylist && (
              <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
                <div className="flex items-center gap-4">
                  <img 
                    src={selectedPlaylist.image || 'https://via.placeholder.com/60'} 
                    alt={selectedPlaylist.name}
                    className="w-14 h-14 rounded-lg object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-white truncate">{selectedPlaylist.name}</p>
                    <p className="text-sm text-gray-400">{selectedPlaylist.tracks.total} utworów</p>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
                {error}
              </div>
            )}

            <button
              onClick={handleStartGame}
              disabled={!selectedPlaylist || loading}
              className={`w-full py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2 ${
                selectedPlaylist && !loading
                  ? 'bg-green-500 hover:bg-green-400 text-black'
                  : 'bg-gray-700 text-gray-500 cursor-not-allowed'
              }`}
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                  Ładowanie...
                </>
              ) : (
                <>
                  {roomType === 'Solo' ? 'Rozpocznij grę' : 'Stwórz pokój'}
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </>
              )}
            </button>
          </div>

          <div className="lg:col-span-2 bg-[#1f1f3a] rounded-2xl p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
              <h2 className="text-xl font-bold text-white">Wybierz playlistę</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveTab('my')}
                  className={`px-4 py-2 rounded-full text-sm font-bold transition-colors ${
                    activeTab === 'my' ? 'bg-white text-black' : 'bg-[#2a2a4a] text-gray-400 hover:text-white'
                  }`}
                >
                  Moje playlisty
                </button>
                <button
                  onClick={() => setActiveTab('search')}
                  className={`px-4 py-2 rounded-full text-sm font-bold transition-colors ${
                    activeTab === 'search' ? 'bg-white text-black' : 'bg-[#2a2a4a] text-gray-400 hover:text-white'
                  }`}
                >
                  Szukaj
                </button>
              </div>
            </div>

            {activeTab === 'search' && (
              <form onSubmit={handleSearch} className="mb-6">
                <div className="relative">
                  <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Szukaj playlisty..."
                    className="w-full pl-12 pr-4 py-3 bg-[#2a2a4a] border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-green-500"
                  />
                </div>
              </form>
            )}

            <div className="h-[calc(100vh-350px)] overflow-y-auto pr-2 custom-scrollbar">
              {loadingPlaylists ? (
                <div className="flex items-center justify-center py-20">
                  <div className="w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : playlists.length === 0 ? (
                <div className="text-center py-20 text-gray-500">
                  {activeTab === 'search' ? 'Wpisz nazwę playlisty i wyszukaj' : 'Brak playlist'}
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {playlists.map((playlist) => (
                    <button
                      key={playlist.id}
                      onClick={() => setSelectedPlaylist(playlist)}
                      className={`group relative aspect-square rounded-xl overflow-hidden transition-all ${
                        selectedPlaylist?.id === playlist.id 
                          ? 'ring-4 ring-green-500 scale-[0.98]' 
                          : 'hover:scale-[1.02]'
                      }`}
                    >
                      <img 
                        src={playlist.image || 'https://via.placeholder.com/200'} 
                        alt={playlist.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-3">
                        <p className="font-bold text-white text-sm truncate">{playlist.name}</p>
                        <p className="text-xs text-gray-400">{playlist.tracks.total} utworów</p>
                      </div>
                      {selectedPlaylist?.id === playlist.id && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                          <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                            <svg className="w-6 h-6 text-black" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth={3} fill="none" />
                            </svg>
                          </div>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
