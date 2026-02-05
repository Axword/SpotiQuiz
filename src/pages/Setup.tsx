import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Play, Type, Grid, Music, Users, ArrowRight, List, Library, Star, ArrowLeft, Link as LinkIcon } from 'lucide-react';
import { useGameStore } from '../store/gameStore';
import { searchPlaylists, fetchPlaylistTracks, getUserPlaylists, SpotifyPlaylist } from '../lib/spotify';
import { Button } from '../components/ui/Button';
import { Layout } from '../components/Layout';
import { translations } from '../lib/translations';
// ...existing code...

const Setup = () => {
  const navigate = useNavigate();
  const { 
    token, 
    setTracks, 
    startGame, 
    setGameSettings, 
    roomType,
    roundsCount,
    gameMode,
    language,
    createRoom
  } = useGameStore();
  
  const t = translations[language];

  const [activeTab, setActiveTab] = useState<'search' | 'my' | 'featured' | 'url'>('featured');
  const [query, setQuery] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [playlists, setPlaylists] = useState<SpotifyPlaylist[]>([]);
  // ...existing code...

  // Hardcoded featured playlists data (fallback for unauthenticated)
  const FEATURED_PLAYLISTS: SpotifyPlaylist[] = [
    {
      id: '37i9dQZEVXbN6itCcaL3Tt',
      name: 'Top Hits Polska',
      // ...existing code...
      image: 'https://i.scdn.co/image/ab67706f00000002c0e7e6e6e6e6e6e6e6e6e6e6',
      tracks: { total: 50 },
    },
    {
      id: '37i9dQZEVXbMDoHDwVN2tF',
      name: 'Global Top 50',
      // ...existing code...
      image: 'https://i.scdn.co/image/ab67706f00000002b0e7e6e6e6e6e6e6e6e6e6e6',
      tracks: { total: 50 },
    },
    {
      id: '37i9dQZF1DX4UtSsGT1Sbe',
      name: 'RapCaviar',
      // ...existing code...
      image: 'https://i.scdn.co/image/ab67706f00000002a0e7e6e6e6e6e6e6e6e6e6e6',
      tracks: { total: 50 },
    },
    {
      id: '37i9dQZF1DXbTxeAdrVG2l',
      name: 'Pop Rising',
      // ...existing code...
      image: 'https://i.scdn.co/image/ab67706f0000000290e7e6e6e6e6e6e6e6e6e6e6',
      tracks: { total: 50 },
    },
    {
      id: '5ABHKGoOzxkaa28ttQV9sE',
      name: 'Peaceful Piano',
      // ...existing code...
      image: 'https://i.scdn.co/image/ab67706f0000000280e7e6e6e6e6e6e6e6e6e6e6',
      tracks: { total: 50 },
    },
  ];
  const [selectedPlaylist, setSelectedPlaylist] = useState<SpotifyPlaylist | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPlaylists = async () => {
      setLoading(true);
      let results: SpotifyPlaylist[] = [];
      try {
        if (!token) {
          // No token: show hardcoded featured playlists only
          if (activeTab === 'featured') {
            setPlaylists(FEATURED_PLAYLISTS);
          } else {
            setPlaylists([]);
          }
        } else {
          if (activeTab === 'my') {
            results = await getUserPlaylists(token);
            setPlaylists(results);
          } else if (activeTab === 'featured') {
            // Optionally: fetch from API, but fallback to hardcoded if error
            // ...existing code...
            setPlaylists(FEATURED_PLAYLISTS);
          } else if (activeTab === 'search' && query) {
            results = await searchPlaylists(token, query);
            setPlaylists(results);
          } else {
            setPlaylists([]);
          }
        }
      } catch (e) {
        setError('Nie udało się załadować playlist.');
      }
      setLoading(false);
    };
    loadPlaylists();
  }, [token, activeTab, query]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
  };

  const handleBack = () => {
    navigate('/');
  };

  const extractPlaylistId = (url: string) => {
    const match = url.match(/playlist\/([a-zA-Z0-9]+)/);
    return match ? match[1] : url;
  };

  const handleStartGame = async () => {
    let pid = selectedPlaylist?.id;
    
    if (activeTab === 'url') {
      if (!urlInput) return;
      pid = extractPlaylistId(urlInput);
    }

    if (!pid) return;
    
    setLoading(true);
    setError(null);
    try {
      const tracks = await fetchPlaylistTracks(token || '', pid);
      
      let finalTracks = tracks;
      
      if (tracks.length < roundsCount) {
         setGameSettings({ roundsCount: tracks.length });
      }

      const shuffledTracks = finalTracks.sort(() => 0.5 - Math.random());
      
      if (shuffledTracks.length === 0) {
          setError(t.errorTooFewTracks);
          setLoading(false);
          return;
      }

      setTracks(shuffledTracks);
      
      if (roomType === 'LocalHost') {
        createRoom();
        navigate('/lobby');
      } else {
        startGame();
        navigate('/game');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || t.errorGeneric);
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="grid lg:grid-cols-12 gap-8 h-[80vh]">
        <div className="lg:col-span-4 space-y-6 overflow-y-auto pr-2">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Button variant="ghost" size="sm" onClick={handleBack} className="p-0 hover:bg-transparent text-gray-400 hover:text-white">
                <ArrowLeft className="w-6 h-6" />
              </Button>
              <h2 className="text-3xl font-bold">{t.settings}</h2>
            </div>
            
            <div className="space-y-6">
              <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                <div className="flex items-center gap-3 mb-2 text-green-400">
                  {roomType === 'Solo' ? <Music /> : <Users />}
                  <span className="font-bold uppercase tracking-wider text-sm">
                    {roomType === 'Solo' ? t.soloMode : t.hostMode}
                  </span>
                </div>
                <p className="text-xs text-gray-400">
                  {roomType === 'Solo' 
                    ? t.soloDesc 
                    : t.hostDesc}
                </p>
              </div>

              <div>
                <label className="text-sm text-gray-400 font-bold mb-3 block uppercase tracking-wider">{t.roundCount}</label>
                <div className="grid grid-cols-3 gap-2">
                  {[10, 20, 30].map(count => (
                    <button
                      key={count}
                      onClick={() => setGameSettings({ roundsCount: count })}
                      className={`py-2 rounded-lg font-bold transition-all ${
                        roundsCount === count 
                          ? 'bg-green-500 text-black shadow-lg shadow-green-500/20' 
                          : 'bg-[#282828] text-gray-400 hover:bg-[#333]'
                      }`}
                    >
                      {count}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-400 font-bold mb-3 block uppercase tracking-wider">{t.gameMode}</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setGameSettings({ gameMode: 'ABCD' })}
                    className={`p-3 rounded-lg font-bold text-left transition-all border ${
                      gameMode === 'ABCD'
                        ? 'bg-purple-500/20 border-purple-500 text-purple-400'
                        : 'bg-[#282828] border-transparent text-gray-400 hover:bg-[#333]'
                    }`}
                  >
                    <Grid className="w-5 h-5 mb-2" />
                    <div className="text-sm line-clamp-1">{t.modeAbcd}</div>
                  </button>
                  
                  <button
                    onClick={() => setGameSettings({ gameMode: 'Type' })}
                    className={`p-3 rounded-lg font-bold text-left transition-all border ${
                      gameMode === 'Type'
                        ? 'bg-blue-500/20 border-blue-500 text-blue-400'
                        : 'bg-[#282828] border-transparent text-gray-400 hover:bg-[#333]'
                    }`}
                  >
                    <Type className="w-5 h-5 mb-2" />
                    <div className="text-sm line-clamp-1">{t.modeType}</div>
                  </button>

                   <button
                    onClick={() => setGameSettings({ gameMode: 'List' })}
                    className={`p-3 rounded-lg font-bold text-left transition-all border ${
                      gameMode === 'List'
                        ? 'bg-yellow-500/20 border-yellow-500 text-yellow-400'
                        : 'bg-[#282828] border-transparent text-gray-400 hover:bg-[#333]'
                    }`}
                  >
                    <List className="w-5 h-5 mb-2" />
                    <div className="text-sm line-clamp-1">{t.modeList}</div>
                  </button>
                </div>
              </div>

            </div>
          </div>

          {(selectedPlaylist || activeTab === 'url') && (
             <div className="animate-fade-in pt-6 border-t border-white/10">
               {selectedPlaylist && activeTab !== 'url' && (
                 <div className="flex items-center gap-4 mb-4">
                   <img src={selectedPlaylist.image} alt={selectedPlaylist.name} className="w-16 h-16 rounded shadow-lg" />
                   <div>
                     <h3 className="font-bold line-clamp-1">{selectedPlaylist.name}</h3>
                     <p className="text-sm text-gray-400">{selectedPlaylist.tracks.total} {t.rounds}</p>
                   </div>
                 </div>
               )}
               
               {error && (
                 <div className="p-3 bg-red-500/20 text-red-400 text-sm rounded-lg mb-4 border border-red-500/20">
                   {error}
                 </div>
               )}

               <Button 
                 fullWidth 
                 size="lg" 
                 onClick={handleStartGame}
                 disabled={loading || (activeTab === 'url' && !urlInput)}
                 className="group"
               >
                 {loading ? t.loading : (
                   <>
                    {roomType === 'LocalHost' ? t.create : t.startGame} <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                   </>
                 )}
               </Button>
             </div>
          )}
        </div>

        <div className="lg:col-span-8 bg-[#181818] rounded-2xl p-6 flex flex-col items-center justify-center min-h-[600px]">
          <div className="flex flex-col md:flex-row md:items-center justify-center mb-6 gap-4 w-full">
            <h3 className="text-xl font-bold text-center w-full">{t.selectPlaylist}</h3>
            <div className="flex gap-2 flex-wrap justify-center w-full">
                <button 
                    onClick={() => setActiveTab('featured')}
                    className={`px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 transition-colors ${activeTab === 'featured' ? 'bg-white text-black' : 'bg-[#282828] text-gray-400 hover:text-white'}`}
                >
                    <Star className="w-4 h-4" /> {t.featured}
                </button>
                <button 
                    onClick={() => setActiveTab('my')}
                    disabled={!token}
                    className={`px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 transition-colors ${activeTab === 'my' ? 'bg-white text-black' : 'bg-[#282828] text-gray-400 hover:text-white'} ${!token ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    <Library className="w-4 h-4" /> {t.myPlaylists}
                </button>
                <button 
                    onClick={() => setActiveTab('search')}
                    disabled={!token}
                    className={`px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 transition-colors ${activeTab === 'search' ? 'bg-white text-black' : 'bg-[#282828] text-gray-400 hover:text-white'} ${!token ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    <Search className="w-4 h-4" /> {t.search}
                </button>
                <button 
                    onClick={() => setActiveTab('url')}
                    className={`px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 transition-colors ${activeTab === 'url' ? 'bg-white text-black' : 'bg-[#282828] text-gray-400 hover:text-white'}`}
                >
                    <LinkIcon className="w-4 h-4" /> URL
                </button>
            </div>

            {activeTab === 'search' && token && (
              <form onSubmit={handleSearch} className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder={t.searchPlaylist}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full bg-[#282828] rounded-full py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-white/20"
                />
              </form>
            )}
          </div>

          {activeTab === 'url' ? (
             <div className="flex flex-col items-center justify-center h-full text-center p-8 space-y-4">
                <LinkIcon className="w-16 h-16 text-gray-600 mb-4" />
                <h3 className="text-xl font-bold">Wklej link do playlisty</h3>
                <p className="text-gray-400 max-w-md">Możesz wkleić tutaj dowolny link do playlisty Spotify (np. od znajomego), aby w nią zagrać.</p>
                <input 
                  type="text" 
                  placeholder="https://open.spotify.com/playlist/..." 
                  className="w-full max-w-lg bg-[#282828] border border-white/10 rounded-lg p-4 text-white focus:outline-none focus:border-green-500"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                />
             </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6 overflow-y-auto pr-2 pb-20 custom-scrollbar w-full max-h-[520px] mx-auto items-start justify-center">
              {playlists.map((playlist) => (
                <div
                  key={playlist.id}
                  onClick={() => setSelectedPlaylist(playlist)}
                  className={`group relative aspect-square rounded-lg overflow-hidden cursor-pointer transition-all flex flex-col ${
                    selectedPlaylist?.id === playlist.id ? 'ring-4 ring-green-500' : 'hover:scale-[1.02]'
                  }`}
                >
                  <img src={playlist.image || 'https://via.placeholder.com/300'} alt={playlist.name} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors" />
                  <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/90 to-transparent flex flex-col items-start">
                    <span className="text-xs text-gray-300 font-mono mb-1">{playlist.tracks.total} utworów</span>
                    <h3 className="font-bold truncate text-base">{playlist.name}</h3>
                  </div>
                  {selectedPlaylist?.id === playlist.id && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                      <div className="bg-green-500 rounded-full p-3 shadow-xl">
                        <Play className="w-6 h-6 text-black fill-current" />
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {playlists.length === 0 && !loading && (
                <div className="col-span-full text-center text-gray-500 py-10">
                  Brak playlist do wyświetlenia.
                </div>
              )}
            </div>
          )}
          
          {!token && (
             <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl text-center">
               <p className="text-sm text-blue-200">
                 {t.loginSpotify}
               </p>
             </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Setup;