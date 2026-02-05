import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Music, Mic2, Users, Play, LogIn } from 'lucide-react';
import { useGameStore } from '../store/gameStore';
import { AUTH_URL, getTokenFromUrl } from '../lib/spotify';
import { Button } from '../components/ui/Button';
import { Layout } from '../components/Layout';
import { Card } from '../components/ui/Card';
import { translations } from '../lib/translations';

const Home = () => {
  const navigate = useNavigate();
  const { setToken, setGameSettings, token, language, joinRoom } = useGameStore();
  const t = translations[language];
  const [joinCode, setJoinCode] = useState("");
  const [showJoinInput, setShowJoinInput] = useState(false);

  useEffect(() => {
    const hash = getTokenFromUrl();
    if (hash.access_token) {
      setToken(hash.access_token);
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
    if (!joinCode) return;
    joinRoom(joinCode);
    navigate('/lobby');
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto text-center space-y-12 animate-fade-in">
        <div className="space-y-4">
          <h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-600 tracking-tight">
            {t.appTitle}
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            {t.subtitle}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {/* Solo */}
          <Card className="p-6 hover:border-green-500/50 transition-colors group cursor-pointer h-full" onClick={handleSoloPlay}>
            <div className="h-12 w-12 bg-green-500/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-green-500/20 transition-colors mx-auto">
              <Music className="w-6 h-6 text-green-500" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">{t.soloMode}</h3>
            <p className="text-gray-400 text-sm">{t.soloDesc}</p>
          </Card>

          {/* Host */}
          <Card className="p-6 hover:border-purple-500/50 transition-colors group cursor-pointer h-full" onClick={handleHostParty}>
            <div className="h-12 w-12 bg-purple-500/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-purple-500/20 transition-colors mx-auto">
              <Mic2 className="w-6 h-6 text-purple-500" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">{t.hostMode}</h3>
            <p className="text-gray-400 text-sm">{t.hostDesc}</p>
          </Card>

          {/* Join */}
          <Card className="p-6 hover:border-blue-500/50 transition-colors group cursor-pointer h-full flex flex-col justify-between">
            <div onClick={() => setShowJoinInput(!showJoinInput)}>
               <div className="h-12 w-12 bg-blue-500/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-blue-500/20 transition-colors mx-auto">
                <Users className="w-6 h-6 text-blue-500" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">{t.joinMode}</h3>
              <p className="text-gray-400 text-sm mb-4">{t.joinDesc}</p>
            </div>
            
            {showJoinInput && (
              <div className="space-y-2 animate-fade-in" onClick={(e) => e.stopPropagation()}>
                <input
                  type="text"
                  placeholder={t.enterCode}
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  maxLength={6}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-center font-mono tracking-widest uppercase focus:border-blue-500 outline-none"
                />
                <Button 
                  size="sm" 
                  className="w-full bg-blue-600 hover:bg-blue-500"
                  onClick={handleJoinParty}
                >
                  {t.join}
                </Button>
              </div>
            )}
          </Card>
        </div>

        <div className="pt-8 border-t border-white/10">
          
          {!token ? (
            <div className="flex flex-col items-center gap-4">
              <p className="text-gray-500 text-sm">
                {t.guest} {t.or} {t.loginSpotify}
              </p>
              <a href={AUTH_URL}>
                <Button size="lg" className="gap-3 bg-[#1DB954] hover:bg-[#1ed760] text-black font-bold px-8">
                  <Play className="w-5 h-5 fill-current" />
                  {t.loginSpotify}
                </Button>
              </a>
            </div>
          ) : (
             <div className="text-green-400 font-medium flex items-center justify-center gap-2">
               <LogIn className="w-5 h-5" />
               {t.loggedInAs} Spotify User
             </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Home;
