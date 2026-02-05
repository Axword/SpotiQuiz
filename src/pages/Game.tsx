import React, { useState, useEffect, useRef } from 'react';
import { playTrack } from '../lib/spotify';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import { Layout } from '../components/Layout';
import { Button } from '../components/ui/Button';
import { Clock, Play, Pause, Check, X, Search, LogOut, Volume2 } from 'lucide-react';
import { translations } from '../lib/translations';
import { playSfx } from '../lib/sfx';

export default function Game() {
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
        roomType,
        language,
        leaveRoom,
        token,
        broadcastMessage
    } = useGameStore();
    const t = translations[language];
    const [timeLeft, setTimeLeft] = useState(30);
    const [isPlaying, setIsPlaying] = useState(false);
    const [choices, setChoices] = useState<any[]>([]);
    const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
    const [isRoundOver, setIsRoundOver] = useState(false);
    const [correctAnswer, setCorrectAnswer] = useState<string | null>(null);
    const [typedAnswer, setTypedAnswer] = useState('');
    const [filteredTracks, setFilteredTracks] = useState<any[]>([]);
    const [showUnmuteOverlay, setShowUnmuteOverlay] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const [player, setPlayer] = useState<any>(null);
    const [deviceId, setDeviceId] = useState<string | null>(null);

    // Timer logic
    const stopTimer = () => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
    };

    const startTimer = () => {
        stopTimer();
        timerRef.current = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    endRound();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const endRound = () => {
        stopTimer();
        setIsRoundOver(true);
        if (audioRef.current) audioRef.current.pause();
        setIsPlaying(false);
        setTimeout(() => {
            handleNextRound();
        }, 1500);
    };

    const handleNextRound = () => {
        if (currentRound >= roundsCount) {
            navigate('/results');
        } else {
            nextRound();
            if (roomType === 'Online') {
                broadcastMessage('next_round', { round: currentRound + 1 });
            }
        }
    };

    const handleAnswer = (id: string) => {
        if (isRoundOver) return;
        setSelectedChoice(id);
        setCorrectAnswer(tracks[currentRound - 1].id);
        if (id === tracks[currentRound - 1].id) {
            addScore(400);
            playSfx.success();
        } else {
            playSfx.error();
        }
        setIsRoundOver(true);
        if (roomType === 'Online') {
            broadcastMessage('player_answer', { 
                playerId: 'self', 
                answer: id, 
                correct: id === tracks[currentRound - 1].id 
            });
        }
        setTimeout(() => {
            handleNextRound();
        }, 1500);
    };

    const handleTypeAnswer = (e: React.FormEvent) => {
        e.preventDefault();
        if (isRoundOver) return;
        if (typedAnswer.trim().toLowerCase() === tracks[currentRound - 1].name.trim().toLowerCase()) {
            addScore(400);
            playSfx.success();
            setCorrectAnswer(tracks[currentRound - 1].id);
        } else {
            playSfx.error();
            setCorrectAnswer(tracks[currentRound - 1].id);
        }
        setIsRoundOver(true);
        if (roomType === 'Online') {
            broadcastMessage('player_answer', { 
                playerId: 'self', 
                answer: typedAnswer, 
                correct: typedAnswer.trim().toLowerCase() === tracks[currentRound - 1].name.trim().toLowerCase() 
            });
        }
        setTimeout(() => {
            handleNextRound();
        }, 1500);
    };

    const togglePlay = async () => {
        if (!audioRef.current) return;
        if (isPlaying) {
            audioRef.current.pause();
            setIsPlaying(false);
        } else {
            try {
                await audioRef.current.play();
                setIsPlaying(true);
                setShowUnmuteOverlay(false);
            } catch (e) {
                setShowUnmuteOverlay(true);
            }
        }
    };

    const handleExit = () => {
        if (audioRef.current) audioRef.current.pause();
        if (player && typeof player.pause === 'function') player.pause();
        leaveRoom();
        navigate('/');
    };

    const handleForceStart = async () => {
        setShowUnmuteOverlay(false);
        if (audioRef.current) {
            try {
                await audioRef.current.play();
                setIsPlaying(true);
            } catch (e) {
                setIsPlaying(false);
            }
        }
    };

    // Web Playback SDK loader
    useEffect(() => {
        if (!token) return;
        if ((window as any).Spotify) return;
        const script = document.createElement('script');
        script.src = 'https://sdk.scdn.co/spotify-player.js';
        script.async = true;
        document.body.appendChild(script);
        return () => {
            document.body.removeChild(script);
        };
    }, [token]);

    // Web Playback SDK init
    useEffect(() => {
        if (!token || player) return;
        (window as any).onSpotifyWebPlaybackSDKReady = () => {
            const p = new (window as any).Spotify.Player({
                name: 'SpotiQuiz Player',
                getOAuthToken: (cb: any) => { cb(token); },
                volume: 0.8
            });
            p.addListener('ready', ({ device_id }: any) => {
                setDeviceId(device_id);
            });
            p.addListener('not_ready', ({ device_id }: any) => {
                if (deviceId === device_id) setDeviceId(null);
            });
            p.connect();
            setPlayer(p);
        };
    }, [token, player, deviceId]);

    // Round logic
    useEffect(() => {
        if (!isGameActive || currentRound > roundsCount) {
            setTimeout(() => navigate('/results'), 100);
            return;
        }
        const track = tracks[currentRound - 1];
        if (!track) return;
        setTimeLeft(30);
        setSelectedChoice(null);
        setIsRoundOver(false);
        setTypedAnswer('');
        setCorrectAnswer(null);
        setIsPlaying(false);
        setShowUnmuteOverlay(false);
        if (gameMode === 'ABCD') {
            const otherTracks = tracks.filter(t => t.id !== track.id);
            const randomChoices = [track, ...otherTracks.sort(() => 0.5 - Math.random()).slice(0, 3)];
            setChoices(randomChoices.sort(() => 0.5 - Math.random()));
        }
        if (gameMode === 'List') {
            setFilteredTracks(tracks);
        }
        if (token && deviceId && track.uri) {
            playTrack(token, deviceId, track.uri).then(() => {
                setIsPlaying(true);
                setShowUnmuteOverlay(false);
            }).catch(() => {
                setIsPlaying(false);
                setShowUnmuteOverlay(true);
            });
        } else if (audioRef.current && track.preview_url) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
            audioRef.current.src = track.preview_url;
            try {
                audioRef.current.play();
                setIsPlaying(true);
            } catch {
                setIsPlaying(false);
            }
        }
        startTimer();
    }, [isGameActive, currentRound, roundsCount, token, deviceId, tracks, gameMode]);

    // List mode filtering
    useEffect(() => {
        if (gameMode === 'List') {
            setFilteredTracks(
                tracks.filter(track =>
                    track.name.toLowerCase().includes(typedAnswer.toLowerCase()) ||
                    track.artist.toLowerCase().includes(typedAnswer.toLowerCase())
                )
            );
        }
    }, [typedAnswer, tracks, gameMode]);

    // Hidden Audio Element
    const AudioElement = (
        <audio
            ref={audioRef}
            onError={() => setShowUnmuteOverlay(true)}
            onCanPlay={() => setShowUnmuteOverlay(false)}
        />
    );

    // Common Header Component to avoid code duplication
    const GameHeader = () => (
        <div className="flex items-center justify-between mb-8 px-4 bg-black/20 p-4 rounded-xl">
            <div>
                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest block">{t.rounds}</span>
                <div className="text-xl font-bold">{currentRound} <span className="text-gray-600 text-sm">/ {roundsCount}</span></div>
            </div>
            
            <div className="flex items-center gap-4">
                <div className="flex flex-col items-center">
                    <Clock className={`w-4 h-4 mb-1 ${timeLeft < 10 ? 'text-red-500 animate-pulse' : 'text-gray-400'}`} />
                    <span className={`font-mono font-bold text-xl ${timeLeft < 10 ? 'text-red-500' : 'text-white'}`}>{timeLeft}s</span>
                </div>
                {/* Mini Play Button in Header */}
                <button 
                    onClick={togglePlay}
                    className="bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors"
                >
                    {isPlaying ? <Pause className="w-5 h-5 fill-white" /> : <Play className="w-5 h-5 fill-white" />}
                </button>
            </div>

            <div className="text-right">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest block">{t.score}</span>
                <div className="text-xl font-bold text-green-400">{score}</div>
            </div>
        </div>
    );

    // Answer Reveal Component (shown after round)
    const AnswerReveal = () => {
        if (!isRoundOver) return null;
        const track = tracks[currentRound - 1];
        return (
            <div className="mb-6 animate-fade-in flex items-center gap-4 bg-[#181818] p-3 rounded-lg border border-white/10">
                <img src={track.image} alt="Cover" className="w-14 h-14 rounded shadow-md" />
                <div className="text-left overflow-hidden">
                    <div className="text-xs text-gray-400 uppercase tracking-wider">{t.answerWas}</div>
                    <div className="text-base font-bold truncate text-white">{track.name}</div>
                    <div className="text-sm text-green-400 truncate">{track.artist}</div>
                </div>
            </div>
        );
    };

    const NextRoundButton = () => {
        if (!isRoundOver) return null;
        return (
            <div className="mt-6 flex justify-center animate-fade-in-up">
                <Button size="lg" onClick={handleNextRound} className="px-10 py-6 text-lg">
                    {currentRound === roundsCount ? t.gameOver : t.nextRound}
                </Button>
            </div>
        );
    }

    // --- RENDER ---
    return (
        <Layout>
            {AudioElement}
            <div className="absolute top-24 left-4 z-40">
                <Button variant="ghost" onClick={handleExit} className="text-gray-400 hover:text-white bg-black/50 backdrop-blur-md">
                    <LogOut className="w-5 h-5 mr-2" />
                    {t.backToHome}
                </Button>
            </div>

            {showUnmuteOverlay && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
                    <div className="text-center">
                        <p className="text-white mb-4 text-xl">Kliknij, aby włączyć dźwięk</p>
                        <Button onClick={handleForceStart} size="lg" className="animate-bounce">
                            <Volume2 className="w-8 h-8 mr-2" /> Włącz Muzykę
                        </Button>
                    </div>
                </div>
            )}

            <div className="max-w-3xl mx-auto w-full pb-8 pt-8 flex flex-col justify-center h-full min-h-[60vh]">
                
                {/* 1. Header with Stats & Play Button */}
                <GameHeader />

                {/* 2. Result Reveal (Only shows when round ends, compact) */}
                <AnswerReveal />

                {/* 3. Game Area (Input/Buttons) */}
                <div className="px-2 w-full">
                    {gameMode === 'ABCD' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {choices.map((choice) => {
                                const isSelected = selectedChoice === choice.id;
                                const isCorrect = correctAnswer === choice.id;
                                const showResult = isRoundOver;
                                let btnClass = "h-20 text-left px-5 text-sm md:text-base transition-all border-2";
                                if (showResult && isCorrect) btnClass += " bg-green-500 text-black border-green-500";
                                else if (showResult && isSelected && !isCorrect) btnClass += " bg-red-500 text-white border-red-500";
                                else if (isSelected) btnClass += " bg-white text-black scale-[1.01] border-white";
                                else btnClass += " bg-[#282828] text-gray-300 border-transparent hover:bg-[#333] hover:border-white/20";
                                return (
                                    <button
                                        key={choice.id}
                                        onClick={() => handleAnswer(choice.id)}
                                        disabled={isRoundOver}
                                        className={`rounded-xl font-bold relative overflow-hidden group ${btnClass}`}
                                    >
                                        <div className="relative z-10 flex items-center justify-between gap-2">
                                            <div className="flex flex-col overflow-hidden">
                                                <span className="truncate w-full block">{choice.name}</span>
                                                <span className="text-xs opacity-60 font-normal truncate block">{choice.artist}</span>
                                            </div>
                                            {showResult && isCorrect && <Check className="w-5 h-5 flex-shrink-0" />}
                                            {showResult && isSelected && !isCorrect && <X className="w-5 h-5 flex-shrink-0" />}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    ) : gameMode === 'Type' ? (
                        <div className="max-w-xl mx-auto w-full">
                            <form onSubmit={handleTypeAnswer} className="relative">
                                <input
                                    type="text"
                                    value={typedAnswer}
                                    onChange={(e) => setTypedAnswer(e.target.value)}
                                    disabled={isRoundOver}
                                    placeholder="Wpisz tytuł utworu..."
                                    className="w-full bg-[#282828] border-2 border-white/10 rounded-xl py-5 px-6 text-lg focus:outline-none focus:border-green-500 focus:bg-[#333] transition-all"
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
                        </div>
                    ) : (
                        <div className="max-w-xl mx-auto relative w-full">
                            <div className="relative mb-3">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                                <input
                                    type="text"
                                    value={typedAnswer}
                                    onChange={(e) => setTypedAnswer(e.target.value)}
                                    disabled={isRoundOver}
                                    placeholder={t.searchPlaylist}
                                    className="w-full bg-[#282828] border-2 border-white/10 rounded-xl py-4 pl-12 pr-6 text-lg focus:outline-none focus:border-green-500 focus:bg-[#333] transition-all"
                                    autoFocus
                                />
                            </div>
                            <div className="h-[300px] overflow-y-auto custom-scrollbar bg-[#181818] rounded-xl border border-white/5">
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
                                            <div className="overflow-hidden">
                                                <div className="font-bold truncate">{track.name}</div>
                                                <div className="text-xs text-gray-500 truncate">{track.artist}</div>
                                            </div>
                                            {isRoundOver && isCorrect && <Check className="w-4 h-4 text-green-500 flex-shrink-0" />}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                    
                    {/* 4. Next Round Button */}
                    <NextRoundButton />
                </div>
            </div>
        </Layout>
    );
}