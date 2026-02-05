import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { Trophy, RefreshCw, Home, Users } from 'lucide-react';
import { useGameStore } from '../store/gameStore';
import { Button } from '../components/ui/Button';
import { Layout } from '../components/Layout';
import { Card } from '../components/ui/Card';
import { translations } from '../lib/translations';

const Results = () => {
  const navigate = useNavigate();
  const { score, roundsCount, resetGame, language } = useGameStore();
  const t = translations[language];

  useEffect(() => {
    // Fire confetti
    const duration = 3000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 2,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#1DB954', '#ffffff']
      });
      confetti({
        particleCount: 2,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#1DB954', '#ffffff']
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  }, []);

  const handlePlayAgain = () => {
    // Only reset game state, keep user and token
    resetGame();
    setTimeout(() => {
      navigate('/setup');
    }, 100);
  };

  const handleGoHome = () => {
    resetGame();
    navigate('/');
  };

  const percentage = Math.round((score / (roundsCount * 400)) * 100); // Rough estimate max score logic

  return (
    <Layout>
      <div className="max-w-md mx-auto text-center space-y-8 animate-fade-in-up">
        
        <div className="relative inline-block">
          <div className="absolute inset-0 bg-green-500 blur-3xl opacity-20 rounded-full" />
          <Trophy className="w-24 h-24 text-[#ffd700] drop-shadow-lg relative z-10 mx-auto" />
        </div>

        <div className="space-y-2">
          <h1 className="text-4xl font-black text-white">{t.gameOver}</h1>
          <p className="text-gray-400">{t.score}</p>
        </div>

        <Card className="p-8 border border-white/10 bg-white/5 backdrop-blur-sm">
          <div className="grid grid-cols-2 gap-8 mb-8">
             <div>
               <div className="text-sm uppercase tracking-widest text-gray-500 font-bold mb-1">{t.score}</div>
               <div className="text-4xl font-black text-green-400">{score}</div>
             </div>
             <div>
               <div className="text-sm uppercase tracking-widest text-gray-500 font-bold mb-1">{t.rounds}</div>
               <div className="text-4xl font-black text-white">{roundsCount}</div>
             </div>
          </div>
          
          <div className="space-y-4">
             <div className="bg-[#121212] rounded-full h-4 w-full overflow-hidden border border-white/5">
                <div 
                   className="bg-green-500 h-full transition-all duration-1000" 
                   style={{ width: `${Math.min(percentage, 100)}%` }} 
                />
             </div>
             <p className="text-sm text-gray-400">
               {percentage > 80 ? 'Niesamowicie! Jesteś mistrzem muzyki!' : 
                percentage > 50 ? 'Nieźle! Masz potencjał.' : 'Może następnym razem pójdzie lepiej?'}
             </p>
          </div>
        </Card>

        <div className="flex flex-col gap-4">
          <Button size="lg" onClick={handlePlayAgain} fullWidth className="group">
            <RefreshCw className="w-5 h-5 mr-2 group-hover:rotate-180 transition-transform" />
            {t.playAgain}
          </Button>
          
          <Button variant="ghost" onClick={handleGoHome} fullWidth>
            <Home className="w-5 h-5 mr-2" />
            {t.backToHome}
          </Button>
        </div>

      </div>
    </Layout>
  );
};

export default Results;
