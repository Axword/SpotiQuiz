import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import { getAvailableDevices, transferPlayback, SpotifyDevice } from '../lib/spotify';

export default function DeviceSelect() {
  const navigate = useNavigate();
  const { token, setDeviceId, setDevices } = useGameStore();
  const [devices, setLocalDevices] = useState<SpotifyDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selecting, setSelecting] = useState<string | null>(null);

  const fetchDevices = async () => {
    if (!token) {
      navigate('/');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const deviceList = await getAvailableDevices(token);
      setLocalDevices(deviceList);
      setDevices(deviceList);
    } catch (err) {
      console.error(err);
      setError('Nie udało się pobrać urządzeń');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDevices();
  }, [token]);

  const handleSelectDevice = async (device: SpotifyDevice) => {
    if (!token) return;
    
    setSelecting(device.id);
    try {
      await transferPlayback(token, device.id);
      setDeviceId(device.id);
      navigate('/mode');
    } catch (err) {
      console.error(err);
      setError('Nie udało się przełączyć na to urządzenie');
    } finally {
      setSelecting(null);
    }
  };

  const getDeviceIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'computer':
        return (
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25" />
          </svg>
        );
      case 'smartphone':
        return (
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
          </svg>
        );
      case 'speaker':
        return (
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
          </svg>
        );
      default:
        return (
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 01-.99-3.467l2.31-.66A2.25 2.25 0 009 15.553z" />
          </svg>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a1a2e] via-[#16213e] to-[#0f0f23] flex items-center justify-center p-4">
      <div className="max-w-lg w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Wybierz urządzenie</h1>
          <p className="text-gray-400">Gdzie chcesz odtwarzać muzykę?</p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 mx-auto border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-400 mb-4">{error}</p>
            <button
              onClick={fetchDevices}
              className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors"
            >
              Spróbuj ponownie
            </button>
          </div>
        ) : devices.length === 0 ? (
          <div className="text-center py-12 bg-[#2a2a4a] rounded-2xl border border-white/10">
            <div className="w-16 h-16 mx-auto mb-4 bg-yellow-500/20 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <p className="text-white font-semibold mb-2">Brak aktywnych urządzeń</p>
            <p className="text-gray-400 text-sm mb-6 px-4">
              Otwórz Spotify na dowolnym urządzeniu i odtwórz cokolwiek, aby je aktywować.
            </p>
            <button
              onClick={fetchDevices}
              className="px-6 py-2 bg-green-500 hover:bg-green-400 text-black font-bold rounded-full transition-colors"
            >
              Odśwież listę
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {devices.map((device) => (
              <button
                key={device.id}
                onClick={() => handleSelectDevice(device)}
                disabled={selecting !== null}
                className={`w-full p-4 rounded-xl border transition-all flex items-center gap-4 ${
                  device.is_active
                    ? 'bg-green-500/20 border-green-500 text-green-400'
                    : 'bg-[#2a2a4a] border-white/10 text-white hover:border-white/30'
                } ${selecting === device.id ? 'opacity-50' : ''}`}
              >
                <div className={device.is_active ? 'text-green-400' : 'text-gray-400'}>
                  {getDeviceIcon(device.type)}
                </div>
                <div className="flex-1 text-left">
                  <p className="font-semibold">{device.name}</p>
                  <p className="text-sm text-gray-400 capitalize">{device.type}</p>
                </div>
                {device.is_active && (
                  <span className="text-xs bg-green-500 text-black px-2 py-1 rounded-full font-bold">
                    AKTYWNE
                  </span>
                )}
                {selecting === device.id && (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                )}
              </button>
            ))}
            
            <button
              onClick={fetchDevices}
              className="w-full py-3 text-gray-400 hover:text-white transition-colors text-sm"
            >
              Odśwież listę urządzeń
            </button>
          </div>
        )}

        <button
          onClick={() => navigate('/mode')}
          className="w-full mt-6 py-3 text-gray-500 hover:text-white transition-colors"
        >
          Pomiń (użyj domyślnego urządzenia)
        </button>
      </div>
    </div>
  );
}
