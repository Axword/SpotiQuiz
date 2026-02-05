import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import { redirectToAuthCodeFlow } from '../lib/spotify';
import { resumeAudioContext } from '../lib/sounds';

export default function Home() {
  const navigate = useNavigate();
  const { token } = useGameStore();

  const handleLogin = async () => {
    resumeAudioContext();
    await redirectToAuthCodeFlow();
  };

  const handleJoinParty = () => {
    resumeAudioContext();
    navigate('/join');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a1a2e] via-[#16213e] to-[#0f0f23] flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-12">
          <div className="w-28 h-28 mx-auto mb-6 bg-gradient-to-br from-green-400 to-green-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-green-500/30 rotate-3 hover:rotate-0 transition-transform">
            <span className="text-white font-bold text-5xl">Q</span>
          </div>
          <h1 className="text-5xl font-bold text-white mb-3">
            Spoti<span className="text-green-400">Quiz</span>
          </h1>
          <p className="text-gray-400 text-lg">
            Zgaduj utwory i rywalizuj ze znajomymi!
          </p>
        </div>

        <div className="space-y-4">
          {token ? (
            <button
              onClick={() => { resumeAudioContext(); navigate('/mode'); }}
              className="w-full py-4 px-6 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-400 hover:to-green-500 text-white font-bold text-lg rounded-full transition-all transform hover:scale-[1.02] shadow-lg shadow-green-500/30"
            >
              Kontynuuj
            </button>
          ) : (
            <button
              onClick={handleLogin}
              className="w-full py-4 px-6 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-400 hover:to-green-500 text-white font-bold text-lg rounded-full transition-all transform hover:scale-[1.02] shadow-lg shadow-green-500/30 flex items-center justify-center gap-3"
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
              </svg>
              Zaloguj się przez Spotify
            </button>
          )}

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-700"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-[#16213e] text-gray-500">lub</span>
            </div>
          </div>

          <button
            onClick={handleJoinParty}
            className="w-full py-4 px-6 bg-[#2a2a4a] hover:bg-[#3a3a5a] text-white font-bold text-lg rounded-full transition-all border border-purple-500/30 flex items-center justify-center gap-3"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Dołącz do imprezy
          </button>
        </div>

        <p className="text-center text-gray-600 text-sm mt-8">
          Wymagane konto Spotify Premium do odtwarzania muzyki
        </p>
      </div>
    </div>
  );
}
