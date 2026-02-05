import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Music, Mic2, Users, Play } from 'lucide-react';
import { useGameStore } from '../store/gameStore';
import { AUTH_URL, getTokenFromUrl } from '../lib/spotify';
import { Button } from '../components/ui/Button';
import { Layout } from '../components/Layout';
import { Card } from '../components/ui/Card';

const Home = () => {
  const navigate = useNavigate();
  const { setToken, setGameSettings } = useGameStore();

  useEffect(() => {
    const hash = getTokenFromUrl();
    if (hash.access_token) {
      setToken(hash.access_token);
      // Clear hash to look cleaner
      window.location.hash = "";
    }
  }, [setToken]);

  const handleSoloPlay = () => {
    setGameSettings({ roomType: 'Solo' });
    navigate('/setup');
  };

  const handleHostParty = () => {
    setGameSettings({ roomType: 'LocalHost' });
    navigate('/setup');
  };

  const handleJoinParty = () => {
    // Ideally this goes to a "Enter Code" screen
    alert("Funkcja dołączania do pokoju będzie dostępna wkrótce!");
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto text-center space-y-12 animate-fade-in">
        <div className="space-y-4">
          <h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-600 tracking-tight">
            SpotiQuiz
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Sprawdź swoją wiedzę muzyczną. Zgaduj piosenki, rywalizuj ze znajomymi i baw się przy ulubionych hitach.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <Card className="p-6 hover:border-green-500/50 transition-colors group cursor-pointer" onClick={handleSoloPlay}>
            <div className="h-12 w-12 bg-green-500/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-green-500/20 transition-colors mx-auto">
              <Music className="w-6 h-6 text-green-500" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Graj Sam</h3>
            <p className="text-gray-400 text-sm">
              Tryb dla jednego gracza. Zgaduj utwory i bij własne rekordy.
            </p>
          </Card>

          <Card className="p-6 hover:border-purple-500/50 transition-colors group cursor-pointer" onClick={handleHostParty}>
            <div className="h-12 w-12 bg-purple-500/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-purple-500/20 transition-colors mx-auto">
              <Mic2 className="w-6 h-6 text-purple-500" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Gospodarz Imprezy</h3>
            <p className="text-gray-400 text-sm">
              Twój telefon to głośnik. Inni gracze zgadują na swoich urządzeniach.
            </p>
          </Card>

          <Card className="p-6 hover:border-blue-500/50 transition-colors group cursor-pointer" onClick={handleJoinParty}>
            <div className="h-12 w-12 bg-blue-500/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-blue-500/20 transition-colors mx-auto">
              <Users className="w-6 h-6 text-blue-500" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Dołącz do Gry</h3>
            <p className="text-gray-400 text-sm">
              Wpisz kod pokoju i dołącz do trwającej rozgrywki.
            </p>
          </Card>
        </div>

        <div className="pt-8 border-t border-white/10">
          <p className="text-gray-500 mb-6 text-sm">
            Zaloguj się przez Spotify, aby grać na własnych playlistach i odblokować pełną wersję.
          </p>
          
          {!useGameStore.getState().token ? (
            <a href={AUTH_URL}>
              <Button size="lg" className="gap-3 bg-[#1DB954] hover:bg-[#1ed760] text-black font-bold px-8">
                <Play className="w-5 h-5 fill-current" />
                Zaloguj z Spotify
              </Button>
            </a>
          ) : (
             <div className="text-green-400 font-medium">
               Jesteś zalogowany w Spotify!
             </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Home;
