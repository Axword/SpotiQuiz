import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import { Layout } from '../components/Layout';
import { Button } from '../components/ui/Button';
import { Clock, SkipForward, Play, Pause, Check, X, Search } from 'lucide-react';

const Game = () => {
  const navigate = useNavigate();
  const { 
    tracks, 
    currentRound, 
    roundsCount, 
    score, 
    addScore, 
    nextRound, 
    isGameActive, 
    gameMode,
    roomType 
  } = useGameStore();

  const [timeLeft, setTimeLeft] = useState(30);
  const [isPlaying, setIsPlaying] = useState(false);
  const [choices, setChoices] = useState<any[]>([]);
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [isRoundOver, setIsRoundOver] = useState(false);
  const [correctAnswer, setCorrectAnswer] = useState<string | null>(null);
  const [typedAnswer, setTypedAnswer] = useState('');
  const [volume] = useState(0.5); // Fixed volume for now
  
  // List Mode State
  const [filteredTracks, setFilteredTracks] = useState<any[]>([]);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize Audio
  useEffect(() => {
    audioRef.current = new Audio();
    audioRef.current.volume = volume;
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
      }
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Round Setup
  useEffect(() => {
    if (!isGameActive || currentRound > roundsCount) {
      navigate('/results');
      return;
    }

    const track = tracks[currentRound - 1];
    if (!track) return; // Should not happen

    // Setup Audio
    if (audioRef.current) {
      audioRef.current.src = track.preview_url || '';
      audioRef.current.load();
      // Try to play immediately, but browser might block
      audioRef.current.play()
        .then(() => setIsPlaying(true))
        .catch(e => {
          console.warn("Autoplay blocked", e);
          setIsPlaying(false);
        });
    }

    // Reset State
    setTimeLeft(30);
    setSelectedChoice(null);
    setIsRoundOver(false);
    setTypedAnswer('');
    setCorrectAnswer(null);

    // Generate Choices for ABCD
    if (gameMode === 'ABCD') {
      const wrongChoices = tracks
        .filter(t => t.id !== track.id)
        .sort(() => 0.5 - Math.random())
        .slice(0, 3);
      
      const roundChoices = [...wrongChoices, track]
        .sort(() => 0.5 - Math.random());
        
      setChoices(roundChoices);
    }
    
    // Reset list filter
    if (gameMode === 'List') {
        setFilteredTracks(tracks.sort((a, b) => a.name.localeCompare(b.name)));
    }

    // Start Timer
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          handleTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentRound, tracks, isGameActive]); // Depend only on round change

  const handleTimeUp = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    
    // Auto-select wrong if nothing selected?
    // Actually just end round.
    const track = tracks[currentRound - 1];
    setCorrectAnswer(track.id);
    setIsRoundOver(true);
    if (audioRef.current) audioRef.current.pause();
    setIsPlaying(false);
  };

  const handleAnswer = (answerId: string) => {
    if (isRoundOver) return;
    
    setSelectedChoice(answerId);
    
    const track = tracks[currentRound - 1];
    const isCorrect = answerId === track.id;
    
    if (isCorrect) {
      // Calculate score based on time left
      const points = 100 + (timeLeft * 10);
      addScore(points);
    }
    
    setCorrectAnswer(track.id);
    endRound();
  };

  const handleTypeAnswer = (e: React.FormEvent) => {
    e.preventDefault();
    if (isRoundOver) return;

    const track = tracks[currentRound - 1];
    // Simple fuzzy match
    const cleanAnswer = typedAnswer.toLowerCase().trim();
    const cleanCorrect = track.name.toLowerCase().trim();
    
    // Check if answer contains significant part of title
    const isCorrect = cleanCorrect.includes(cleanAnswer) && cleanAnswer.length > 3;

    if (isCorrect) {
        addScore(100 + (timeLeft * 10));
        setSelectedChoice('correct-typed'); // visual flag
    } else {
        setSelectedChoice('wrong-typed');
    }

    setCorrectAnswer(track.id);
    endRound();
  };
  
  // Search handler for List mode
  useEffect(() => {
    if (gameMode === 'List') {
        if (!typedAnswer) {
            setFilteredTracks(tracks);
        } else {
            const query = typedAnswer.toLowerCase();
            setFilteredTracks(tracks.filter(t => 
                t.name.toLowerCase().includes(query) || 
                t.artist.toLowerCase().includes(query)
            ));
        }
    }
  }, [typedAnswer, tracks, gameMode]);

  const endRound = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsRoundOver(true);
    if (audioRef.current) audioRef.current.pause();
    setIsPlaying(false);
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleNextRound = () => {
    if (currentRound >= roundsCount) {
      navigate('/results');
    } else {
      nextRound();
    }
  };

  // Host Mode View
  if (roomType === 'LocalHost') {
    return (
        <Layout>
            <div className="max-w-2xl mx-auto text-center space-y-8 pt-10">
                <div className="text-sm uppercase tracking-widest text-gray-500 font-bold">
                    Runda {currentRound} / {roundsCount}
                </div>
                
                <div className="py-12 relative">
                    {/* Vinyl Animation */}
                    <div className={`w-64 h-64 rounded-full bg-black border-4 border-[#282828] mx-auto flex items-center justify-center shadow-2xl relative ${isPlaying ? 'animate-spin-slow' : ''}`}>
                         <div className="absolute inset-0 rounded-full bg-[repeating-radial-gradient(#222_0,#111_2px,#222_4px)] opacity-50" />
                         <img 
                            src={isRoundOver ? tracks[currentRound-1].image : 'https://i.scdn.co/image/ab67616d0000b2735f8f553f'} 
                            className={`w-24 h-24 rounded-full object-cover z-10 ${!isRoundOver && 'blur-sm'}`} 
                            alt="Cover"
                         />
                         <div className="w-8 h-8 bg-black rounded-full absolute z-20 border-2 border-[#333]" />
                    </div>
                </div>

                <div className="space-y-4">
                     {isRoundOver ? (
                         <div className="animate-fade-in">
                             <h2 className="text-3xl font-bold text-white mb-2">{tracks[currentRound-1].name}</h2>
                             <p className="text-xl text-green-400">{tracks[currentRound-1].artist}</p>
                         </div>
                     ) : (
                         <div className="text-gray-500 animate-pulse text-2xl font-mono">
                             ???
                         </div>
                     )}
                </div>

                <div className="flex items-center justify-center gap-6">
                    <Button variant="ghost" className="rounded-full w-14 h-14 p-0" onClick={togglePlay}>
                        {isPlaying ? <Pause className="fill-current" /> : <Play className="fill-current ml-1" />}
                    </Button>
                    
                    {isRoundOver && (
                         <Button onClick={handleNextRound} className="animate-bounce">
                             Następna Runda <SkipForward className="ml-2 w-4 h-4" />
                         </Button>
                    )}
                </div>

                {!isRoundOver && (
                    <div className="w-full bg-[#282828] h-2 rounded-full overflow-hidden max-w-md mx-auto">
                        <div 
                            className="bg-green-500 h-full transition-all duration-1000 linear"
                            style={{ width: `${(timeLeft / 30) * 100}%` }}
                        />
                    </div>
                )}
            </div>
        </Layout>
    );
  }

  // Solo Play View
  return (
    <Layout>
      <div className="max-w-2xl mx-auto w-full pb-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
            <div>
                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Runda</span>
                <div className="text-2xl font-bold">{currentRound} <span className="text-gray-600 text-lg">/ {roundsCount}</span></div>
            </div>
            
            <div className="flex flex-col items-center">
                <Clock className={`w-5 h-5 mb-1 ${timeLeft < 10 ? 'text-red-500 animate-pulse' : 'text-gray-400'}`} />
                <span className={`font-mono font-bold text-xl ${timeLeft < 10 ? 'text-red-500' : 'text-white'}`}>
                    {timeLeft}s
                </span>
            </div>

            <div className="text-right">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Wynik</span>
                <div className="text-2xl font-bold text-green-400">{score}</div>
            </div>
        </div>

        {/* Visualizer / Cover */}
        <div className="mb-10 relative group">
            <div className="aspect-video bg-[#181818] rounded-2xl border border-white/5 flex items-center justify-center overflow-hidden relative shadow-2xl">
                 {isRoundOver ? (
                     <div className="absolute inset-0 animate-fade-in flex flex-col items-center justify-center bg-black/80 backdrop-blur-md z-10">
                         <img src={tracks[currentRound-1].image} className="w-48 h-48 rounded-lg shadow-2xl mb-4" />
                         <h2 className="text-2xl font-bold text-center px-4">{tracks[currentRound-1].name}</h2>
                         <p className="text-green-400 font-medium">{tracks[currentRound-1].artist}</p>
                     </div>
                 ) : (
                     <div className="flex gap-1 items-end h-16">
                         {[...Array(8)].map((_, i) => (
                             <div key={i} className={`w-3 bg-green-500 rounded-t-full ${isPlaying ? 'animate-music-bar' : 'h-2'}`} style={{ animationDelay: `${i * 0.1}s` }} />
                         ))}
                     </div>
                 )}
            </div>
            
            {/* Play/Pause Overlay */}
            <button 
                onClick={togglePlay}
                className="absolute bottom-4 right-4 bg-green-500 text-black p-3 rounded-full hover:scale-110 transition-transform shadow-lg z-20"
            >
                {isPlaying ? <Pause className="fill-current w-5 h-5" /> : <Play className="fill-current w-5 h-5 ml-1" />}
            </button>
        </div>

        {/* Game Area */}
        {gameMode === 'ABCD' ? (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 {choices.map((choice) => {
                     const isSelected = selectedChoice === choice.id;
                     const isCorrect = correctAnswer === choice.id;
                     const showResult = isRoundOver;
                     
                     let btnClass = "h-20 text-left px-6 text-sm md:text-base transition-all";
                     if (showResult && isCorrect) btnClass += " bg-green-500 text-black border-green-500";
                     else if (showResult && isSelected && !isCorrect) btnClass += " bg-red-500 text-white border-red-500";
                     else if (isSelected) btnClass += " bg-white text-black scale-[1.02]";
                     else btnClass += " bg-[#282828] text-gray-300 hover:bg-[#333]";

                     return (
                         <button
                             key={choice.id}
                             onClick={() => handleAnswer(choice.id)}
                             disabled={isRoundOver}
                             className={`rounded-xl font-bold relative overflow-hidden group ${btnClass}`}
                         >
                             <div className="relative z-10 flex items-center justify-between">
                                 <div className="flex flex-col">
                                     <span className="line-clamp-1">{choice.name}</span>
                                     <span className="text-xs opacity-60 font-normal">{choice.artist}</span>
                                 </div>
                                 {showResult && isCorrect && <Check className="w-5 h-5" />}
                                 {showResult && isSelected && !isCorrect && <X className="w-5 h-5" />}
                             </div>
                         </button>
                     );
                 })}
             </div>
        ) : gameMode === 'Type' ? (
            // Type Mode
            <div className="max-w-md mx-auto">
                 <form onSubmit={handleTypeAnswer} className="relative">
                     <input
                         type="text"
                         value={typedAnswer}
                         onChange={(e) => setTypedAnswer(e.target.value)}
                         disabled={isRoundOver}
                         placeholder="Wpisz tytuł utworu..."
                         className="w-full bg-[#282828] border-2 border-white/10 rounded-xl py-4 px-6 text-lg focus:outline-none focus:border-green-500 focus:bg-[#333] transition-all"
                         autoFocus
                     />
                     <Button 
                        type="submit" 
                        className="absolute right-2 top-2 bottom-2" 
                        disabled={isRoundOver || !typedAnswer}
                     >
                        Zgadnij
                     </Button>
                 </form>
                 
                 {isRoundOver && (
                     <div className="mt-6 text-center animate-fade-in">
                         <div className="text-gray-400 mb-1">Poprawna odpowiedź:</div>
                         <div className="text-xl font-bold text-green-400">{tracks[currentRound-1].name}</div>
                     </div>
                 )}
            </div>
        ) : (
            // List Mode
            <div className="max-w-md mx-auto relative">
                <div className="relative mb-4">
                     <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                     <input
                         type="text"
                         value={typedAnswer}
                         onChange={(e) => setTypedAnswer(e.target.value)}
                         disabled={isRoundOver}
                         placeholder="Szukaj utworu na liście..."
                         className="w-full bg-[#282828] border-2 border-white/10 rounded-xl py-4 pl-12 pr-6 text-lg focus:outline-none focus:border-green-500 focus:bg-[#333] transition-all"
                         autoFocus
                     />
                </div>
                
                <div className="max-h-64 overflow-y-auto custom-scrollbar bg-[#181818] rounded-xl border border-white/5">
                    {filteredTracks.map(track => {
                        const isSelected = selectedChoice === track.id;
                        const isCorrect = correctAnswer === track.id;
                        
                        let bgClass = "hover:bg-[#282828]";
                        if (isRoundOver) {
                            if (isCorrect) bgClass = "bg-green-500/20 text-green-400";
                            else if (isSelected) bgClass = "bg-red-500/20 text-red-400";
                        }
                        
                        return (
                            <button
                                key={track.id}
                                onClick={() => handleAnswer(track.id)}
                                disabled={isRoundOver}
                                className={`w-full text-left p-4 border-b border-white/5 last:border-0 flex items-center justify-between transition-colors ${bgClass}`}
                            >
                                <div>
                                    <div className="font-bold">{track.name}</div>
                                    <div className="text-xs text-gray-500">{track.artist}</div>
                                </div>
                                {isRoundOver && isCorrect && <Check className="w-4 h-4 text-green-500" />}
                            </button>
                        );
                    })}
                </div>
            </div>
        )}

        {/* Next Round Button */}
        {isRoundOver && (
            <div className="mt-8 flex justify-center animate-fade-in-up">
                <Button size="lg" onClick={handleNextRound} className="px-12">
                    {currentRound === roundsCount ? 'Zobacz Wyniki' : 'Następna Runda'}
                </Button>
            </div>
        )}
      </div>
    </Layout>
  );
};

export default Game;