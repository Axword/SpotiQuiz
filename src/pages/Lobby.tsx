import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Copy, ArrowLeft, Play } from 'lucide-react';
import { useGameStore } from '../store/gameStore';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { translations } from '../lib/translations';

const Lobby = () => {
  const navigate = useNavigate();
  const { 
    roomCode, 
    isHost, 
    gameStatus, 
    startGame, 
    leaveRoom,
    language 
  } = useGameStore();
  
  const t = translations[language];
  const [players] = useState<string[]>([]);
  
  // Redirect if not in lobby
  useEffect(() => {
    if (gameStatus !== 'lobby') {
      navigate('/');
    }
  }, [gameStatus, navigate]);

  // No bots simulation

  const handleStart = () => {
    startGame();
    navigate('/game');
  };

  const handleLeave = () => {
    leaveRoom();
    navigate('/');
  };

  const copyCode = () => {
    if (roomCode) navigator.clipboard.writeText(roomCode);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8 animate-fade-in">
      <div className="flex items-center gap-4 w-full max-w-2xl">
        <Button variant="ghost" onClick={handleLeave} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          {t.back}
        </Button>
      </div>

      <div className="text-center space-y-2">
        <h2 className="text-4xl font-bold text-white">{isHost ? t.hostMode : t.waitingForHost}</h2>
        <p className="text-gray-400">{t.roomCode}</p>
        
        <div 
          className="flex items-center justify-center gap-4 bg-white/10 p-4 rounded-xl cursor-pointer hover:bg-white/20 transition-colors"
          onClick={copyCode}
        >
          <span className="text-5xl font-mono font-black tracking-widest text-[#1DB954]">{roomCode}</span>
          <Copy className="w-6 h-6 text-gray-400" />
        </div>
      </div>

      <Card className="w-full max-w-2xl p-6 min-h-[300px]">
        <div className="flex items-center gap-2 mb-6">
          <Users className="w-5 h-5 text-[#1DB954]" />
          <h3 className="text-xl font-bold">{t.playersConnected} {players.length}</h3>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {/* Host (You) */}
          <div className="bg-white/5 p-4 rounded-lg flex items-center gap-3 border border-[#1DB954]/50">
            <div className="w-8 h-8 rounded-full bg-[#1DB954] flex items-center justify-center font-bold text-black">
              H
            </div>
            <span className="font-medium">Host (Ty)</span>
          </div>

          {/* Connected Players */}
          {players.map((name, i) => (
             <div key={i} className="bg-white/5 p-4 rounded-lg flex items-center gap-3 animate-fade-in">
              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center font-bold text-white">
                {name[0]}
              </div>
              <span className="font-medium">{name}</span>
            </div>
          ))}

          {players.length === 0 && !isHost && (
             <div className="bg-white/5 p-4 rounded-lg flex items-center gap-3 border border-blue-500/50">
               <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center font-bold text-white">
                 T
               </div>
               <span className="font-medium">Ty</span>
             </div>
          )}
        </div>
        
        {players.length === 0 && isHost && (
           <div className="mt-12 text-center text-gray-500 italic">
             {t.waitingForPlayers}
           </div>
        )}
      </Card>

      {isHost && (
        <Button 
          size="lg" 
          className="w-full max-w-md gap-2 bg-[#1DB954] hover:bg-[#1ed760] text-black font-bold"
          onClick={handleStart}
        >
          <Play className="w-5 h-5 fill-current" />
          {t.startNow}
        </Button>
      )}
    </div>
  );
};

export default Lobby;
