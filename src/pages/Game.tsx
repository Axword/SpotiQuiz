import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import { playTrack, pausePlayback } from '../lib/spotify';
import { playCorrectSound, playWrongSound, resumeAudioContext } from '../lib/sounds';
import { Layout } from '../components/Layout';
import { peerManager } from '../lib/peerManager';
import type { PeerMessage } from '../lib/peerManager';

export default function Game() {
  const navigate = useNavigate();
  const {
    token,
    deviceId,
    currentRound,
    roundsCount,
    currentTrack,
    options,
    allTracks,
    gameTracks,
    gameMode,
    roundTime,
    roomType,
    isHost,
    players,
    showAnswer,
    roundStartTime,
    nextRound,
    setShowAnswer,
    submitAnswer,
    setPlayerAnswered,
    allPlayersAnswered
  } = useGameStore();

  const [timeLeft, setTimeLeft] = useState(roundTime);
  const [answer, setAnswer] = useState('');
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [earnedPoints, setEarnedPoints] = useState(0);
  const [isCorrect, setIsCorrect] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showList, setShowList] = useState(false);
  const [autoAdvanceTimer, setAutoAdvanceTimer] = useState(3);
  
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoAdvanceRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const playStartedRef = useRef(false);

  const isPartyHost = roomType === 'Party' && isHost;
  const shouldPlayLocally = roomType === 'Solo' || roomType === 'Normal' || isPartyHost;

  const startMusic = useCallback(async () => {
    if (!token || !currentTrack?.uri || playStartedRef.current) return;
    if (!shouldPlayLocally) return;

    playStartedRef.current = true;
    try {
      const device = deviceId || undefined;
      if (device) {
        await playTrack(token, device, currentTrack.uri, 30000);
      }
    } catch (err) {
      console.error('Error playing track:', err);
    }
  }, [token, deviceId, currentTrack, shouldPlayLocally]);

  const stopMusic = useCallback(async () => {
    if (!token) return;
    if (!shouldPlayLocally) return;

    try {
      await pausePlayback(token, deviceId || undefined);
    } catch (err) {
      console.error('Error pausing:', err);
    }
  }, [token, deviceId, shouldPlayLocally]);

  useEffect(() => {
    if (!currentTrack) {
      navigate('/');
      return;
    }

    resumeAudioContext();
    playStartedRef.current = false;
    setTimeLeft(roundTime);
    setAnswer('');
    setSelectedOption(null);
    setHasAnswered(isPartyHost);
    setEarnedPoints(0);
    setIsCorrect(false);
    setSearchQuery('');
    setShowList(false);

    startMusic();

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          handleTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentRound, currentTrack]);

  useEffect(() => {
    if (roomType === 'Party' && isHost && allPlayersAnswered() && !showAnswer) {
      handleTimeUp();
    }
  }, [players, roomType, isHost]);

  useEffect(() => {
    if (roomType === 'Solo') return;

    const handlePeerMessage = (message: PeerMessage) => {
      switch (message.type) {
        case 'answer-submitted':
          if (isHost) {
            setPlayerAnswered(message.payload.playerId, true);
            const state = useGameStore.getState();
            peerManager.broadcast({ 
              type: 'player-list', 
              payload: state.players 
            });
          }
          break;

        case 'player-list':
          if (!isHost) {
            useGameStore.getState().setPlayers(message.payload);
          }
          break;

        case 'show-answer':
          if (!isHost) {
            setShowAnswer(true);
          }
          break;

        case 'next-round':
          if (!isHost) {
            nextRound();
          }
          break;

        case 'all-answered':
          break;
      }
    };

    peerManager.onMessage(handlePeerMessage);

    return () => {
      peerManager.offMessage(handlePeerMessage);
    };
  }, [roomType, isHost]);

  useEffect(() => {
    if (showAnswer) {
      setAutoAdvanceTimer(3);
      autoAdvanceRef.current = setInterval(() => {
        setAutoAdvanceTimer((prev) => {
          if (prev <= 1) {
            if (autoAdvanceRef.current) clearInterval(autoAdvanceRef.current);
            handleNextRound();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (autoAdvanceRef.current) clearInterval(autoAdvanceRef.current);
    };
  }, [showAnswer]);

  const handleTimeUp = async () => {
    if (!hasAnswered && !isPartyHost) {
      setHasAnswered(true);
      setIsCorrect(false);
      setEarnedPoints(0);
      playWrongSound();
    }
    await stopMusic();
    setShowAnswer(true);
    
    if (isHost && roomType !== 'Solo') {
      peerManager.broadcast({ type: 'show-answer' });
    }
  };

  const checkAnswer = (userAnswer: string): boolean => {
    if (!currentTrack) return false;
    const correct = currentTrack.name.toLowerCase().trim();
    const user = userAnswer.toLowerCase().trim();
    
    if (correct === user) return true;
    if (correct.includes(user) && user.length > 3) return true;
    if (user.includes(correct) && correct.length > 3) return true;
    
    const cleanCorrect = correct.replace(/[^a-z0-9]/g, '');
    const cleanUser = user.replace(/[^a-z0-9]/g, '');
    if (cleanCorrect === cleanUser) return true;
    
    return false;
  };

  const handleSubmitAnswer = async (selectedAnswer?: string) => {
    if (hasAnswered || !currentTrack || !roundStartTime || isPartyHost) return;

    const answerToCheck = selectedAnswer || answer;
    let correct = false;

    if (gameMode === 'ABCD') {
      correct = selectedAnswer === currentTrack.id;
    } else {
      correct = checkAnswer(answerToCheck);
    }

    const timeMs = Date.now() - roundStartTime;
    const playerId = players.find(p => !p.isHost)?.id || players[0]?.id || 'solo';
    const points = submitAnswer(playerId, correct, timeMs);

    setHasAnswered(true);
    setIsCorrect(correct);
    setEarnedPoints(points);
    setSelectedOption(selectedAnswer || null);

    if (correct) {
      playCorrectSound();
    } else {
      playWrongSound();
    }

    if (timerRef.current) clearInterval(timerRef.current);

    if (roomType === 'Solo') {
      await stopMusic();
      setShowAnswer(true);
    } else {
      setPlayerAnswered(playerId, true);
      if (!isHost) {
        peerManager.send({
          type: 'answer-submitted',
          payload: { playerId, correct, timeMs }
        });
      }
    }
  };

  const handleOptionClick = (optionId: string) => {
    if (hasAnswered || isPartyHost) return;
    setSelectedOption(optionId);
    handleSubmitAnswer(optionId);
  };

  const handleNextRound = () => {
    if (autoAdvanceRef.current) clearInterval(autoAdvanceRef.current);
    
    if (isHost && roomType !== 'Solo') {
      peerManager.broadcast({ type: 'next-round' });
    }
    
    if (currentRound >= roundsCount || currentRound >= gameTracks.length) {
      navigate('/results');
    } else {
      nextRound();
    }
  };

  const filteredTracks = allTracks.filter(t => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.artist.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getTimerColor = () => {
    if (timeLeft > roundTime * 0.6) return 'text-green-400';
    if (timeLeft > roundTime * 0.3) return 'text-yellow-400';
    return 'text-red-400';
  };

  if (!currentTrack) return null;

  return (
    <Layout>
      <div className="min-h-[calc(100vh-64px)] p-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="text-gray-400">
              Runda <span className="text-white font-bold">{currentRound}</span> / {Math.min(roundsCount, gameTracks.length)}
            </div>
            <div className={`text-4xl font-mono font-bold ${getTimerColor()}`}>
              {timeLeft}
            </div>
          </div>

          <div className="w-full bg-white/10 rounded-full h-2 mb-8">
            <div 
              className="h-full bg-green-500 rounded-full transition-all duration-1000"
              style={{ width: `${(timeLeft / roundTime) * 100}%` }}
            />
          </div>

          <div className="text-center mb-8">
            {showAnswer && currentTrack.image ? (
              <img 
                src={currentTrack.image} 
                alt={currentTrack.name}
                className="w-32 h-32 mx-auto mb-6 rounded-2xl shadow-2xl object-cover animate-fade-in"
              />
            ) : (
              <div className="w-32 h-32 mx-auto mb-6 bg-gradient-to-br from-green-400 to-green-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-green-500/30 animate-pulse">
                <svg className="w-16 h-16 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 01-.99-3.467l2.31-.66A2.25 2.25 0 009 15.553z" />
                </svg>
              </div>
            )}
            <h2 className="text-2xl font-bold text-white mb-2">
              {showAnswer ? 'Odpowiedź:' : isPartyHost ? 'Gracze zgadują...' : 'Jaki to utwór?'}
            </h2>
            {showAnswer && (
              <div className="animate-fade-in">
                <p className="text-xl text-green-400 font-bold">{currentTrack.name}</p>
                <p className="text-gray-400">{currentTrack.artist}</p>
              </div>
            )}
          </div>

          {isPartyHost && !showAnswer && (
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/20 border border-purple-500/30 rounded-full">
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" />
                <span className="text-purple-300 text-sm">
                  Jako host nie odpowiadasz - czekaj na graczy
                </span>
              </div>
              
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-2">
                {players.filter(p => !p.isHost).map((player) => (
                  <div 
                    key={player.id}
                    className={`p-2 rounded-lg text-sm ${
                      player.hasAnswered 
                        ? 'bg-green-500/20 text-green-400' 
                        : 'bg-white/5 text-gray-400'
                    }`}
                  >
                    {player.name} {player.hasAnswered ? '✓' : '...'}
                  </div>
                ))}
              </div>
            </div>
          )}

          {!showAnswer && !isPartyHost && (
            <div className="space-y-4">
              {gameMode === 'ABCD' && (
                <div className="grid grid-cols-1 gap-3">
                  {options.map((option, index) => (
                    <button
                      key={option.id}
                      onClick={() => handleOptionClick(option.id)}
                      disabled={hasAnswered}
                      className={`p-4 rounded-xl text-left transition-all flex items-center gap-4 ${
                        hasAnswered
                          ? option.id === currentTrack.id
                            ? 'bg-green-500/20 border-2 border-green-500'
                            : selectedOption === option.id
                            ? 'bg-red-500/20 border-2 border-red-500'
                            : 'bg-white/5 border-2 border-transparent opacity-50'
                          : 'bg-[#2a2a4a] border-2 border-transparent hover:border-white/30'
                      }`}
                    >
                      <span className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold ${
                        hasAnswered && option.id === currentTrack.id
                          ? 'bg-green-500 text-black'
                          : hasAnswered && selectedOption === option.id
                          ? 'bg-red-500 text-white'
                          : 'bg-white/10 text-white'
                      }`}>
                        {String.fromCharCode(65 + index)}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-white truncate">{option.name}</p>
                        <p className="text-sm text-gray-400 truncate">{option.artist}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {gameMode === 'Type' && (
                <div>
                  <input
                    type="text"
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSubmitAnswer()}
                    placeholder="Wpisz tytuł utworu..."
                    className="w-full px-6 py-4 bg-[#2a2a4a] border-2 border-white/10 rounded-xl text-white text-lg placeholder-gray-500 focus:outline-none focus:border-green-500"
                    disabled={hasAnswered}
                    autoFocus
                  />
                  <button
                    onClick={() => handleSubmitAnswer()}
                    disabled={hasAnswered || !answer.trim()}
                    className={`w-full mt-4 py-4 rounded-xl font-bold text-lg transition-all ${
                      hasAnswered || !answer.trim()
                        ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                        : 'bg-green-500 hover:bg-green-400 text-black'
                    }`}
                  >
                    Sprawdź
                  </button>
                </div>
              )}

              {gameMode === 'List' && (
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setShowList(true);
                    }}
                    onFocus={() => setShowList(true)}
                    placeholder="Szukaj utworu z playlisty..."
                    className="w-full px-6 py-4 bg-[#2a2a4a] border-2 border-white/10 rounded-xl text-white text-lg placeholder-gray-500 focus:outline-none focus:border-green-500"
                    disabled={hasAnswered}
                  />
                  
                  {showList && !hasAnswered && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-[#2a2a4a] border border-white/10 rounded-xl max-h-64 overflow-y-auto z-10 custom-scrollbar">
                      {filteredTracks.slice(0, 20).map((track) => (
                        <button
                          key={track.id}
                          onClick={() => {
                            setAnswer(track.name);
                            setShowList(false);
                            handleSubmitAnswer(track.id);
                          }}
                          className="w-full p-3 text-left hover:bg-white/10 transition-colors flex items-center gap-3"
                        >
                          <div className="w-10 h-10 bg-white/10 rounded flex-shrink-0 overflow-hidden">
                            {track.image && (
                              <img src={track.image} alt="" className="w-full h-full object-cover" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-white truncate">{track.name}</p>
                            <p className="text-sm text-gray-400 truncate">{track.artist}</p>
                          </div>
                        </button>
                      ))}
                      {filteredTracks.length === 0 && (
                        <div className="p-4 text-center text-gray-500">
                          Brak wyników
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {showAnswer && (
            <div className="text-center space-y-6 animate-fade-in">
              {hasAnswered && !isPartyHost && (
                <div className={`inline-flex items-center gap-3 px-6 py-3 rounded-full ${
                  isCorrect ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                }`}>
                  {isCorrect ? (
                    <>
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="font-bold">+{earnedPoints} pkt</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      <span className="font-bold">Źle!</span>
                    </>
                  )}
                </div>
              )}

              {roomType !== 'Solo' && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-4">
                  {players.filter(p => !p.isHost).map((player) => (
                    <div 
                      key={player.id}
                      className={`p-3 rounded-lg ${
                        player.lastAnswerCorrect 
                          ? 'bg-green-500/20 border border-green-500/30' 
                          : 'bg-red-500/20 border border-red-500/30'
                      }`}
                    >
                      <p className="font-bold text-white text-sm">{player.name}</p>
                      <p className={`text-xs ${player.lastAnswerCorrect ? 'text-green-400' : 'text-red-400'}`}>
                        {player.lastAnswerCorrect ? `+${Math.round(1000 - (player.lastAnswerTime || 0) / (roundTime * 10))} pkt` : 'Źle'}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex flex-col items-center gap-3">
                <div className="flex items-center gap-2 text-gray-400">
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center font-mono font-bold text-white">
                    {autoAdvanceTimer}
                  </div>
                  <span className="text-sm">Następna runda za...</span>
                </div>
                
                {(isHost || roomType === 'Solo') && (
                  <button
                    onClick={handleNextRound}
                    className="w-full py-4 bg-green-500 hover:bg-green-400 text-black font-bold text-lg rounded-xl transition-all flex items-center justify-center gap-2"
                  >
                    {currentRound >= roundsCount || currentRound >= gameTracks.length ? 'Zobacz wyniki' : 'Następna runda'}
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="mt-8 flex items-center justify-center gap-4">
            {players.slice(0, 6).map((player, index) => (
              <div key={player.id} className="text-center">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold mb-1 ${
                  player.isHost 
                    ? 'bg-purple-500 text-white ring-2 ring-purple-300' 
                    : index === 0 
                    ? 'bg-yellow-500 text-black' 
                    : 'bg-white/10 text-white'
                }`}>
                  {player.name.charAt(0).toUpperCase()}
                </div>
                <p className="text-xs text-gray-400">{player.score}</p>
                {player.isHost && <p className="text-[10px] text-purple-400">HOST</p>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
