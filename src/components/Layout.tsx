import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import { getAvailableDevices, transferPlayback } from '../lib/spotify';

interface LayoutProps {
  children: React.ReactNode;
  showNav?: boolean;
}

export function Layout({ children, showNav = true }: LayoutProps) {
  const navigate = useNavigate();
  const { token, deviceId, devices, setDeviceId, setDevices } = useGameStore();
  const [showDeviceMenu, setShowDeviceMenu] = useState(false);
  const [loadingDevices, setLoadingDevices] = useState(false);

  const currentDevice = devices.find(d => d.id === deviceId);

  const handleRefreshDevices = async () => {
    if (!token) return;
    setLoadingDevices(true);
    try {
      const deviceList = await getAvailableDevices(token);
      setDevices(deviceList);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDevices(false);
    }
  };

  const handleSelectDevice = async (id: string) => {
    if (!token) return;
    try {
      await transferPlayback(token, id);
      setDeviceId(id);
      setShowDeviceMenu(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenDeviceMenu = async () => {
    setShowDeviceMenu(!showDeviceMenu);
    if (!showDeviceMenu && token) {
      await handleRefreshDevices();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a1a2e] via-[#16213e] to-[#0f0f23]">
      {showNav && (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-[#1a1a2e]/80 backdrop-blur-lg border-b border-white/5">
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
            <button 
              onClick={() => navigate('/')}
              className="flex items-center gap-3 hover:opacity-80 transition-opacity"
            >
              <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center shadow-lg shadow-green-500/20">
                <span className="text-white font-bold text-xl">Q</span>
              </div>
              <span className="text-white font-bold text-xl hidden sm:block">SpotiQuiz</span>
            </button>

            <div className="flex items-center gap-3">
              {token && (
                <div className="relative">
                  <button
                    onClick={handleOpenDeviceMenu}
                    className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors text-sm"
                  >
                    <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
                    </svg>
                    <span className="text-gray-300 max-w-[120px] truncate hidden sm:block">
                      {currentDevice?.name || 'Wybierz urządzenie'}
                    </span>
                    <svg className={`w-4 h-4 text-gray-400 transition-transform ${showDeviceMenu ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {showDeviceMenu && (
                    <div className="absolute right-0 top-full mt-2 w-72 bg-[#2a2a4a] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50">
                      <div className="p-3 border-b border-white/10 flex items-center justify-between">
                        <span className="text-sm text-gray-400">Urządzenia</span>
                        <button
                          onClick={handleRefreshDevices}
                          disabled={loadingDevices}
                          className="p-1 hover:bg-white/10 rounded transition-colors"
                        >
                          <svg className={`w-4 h-4 text-gray-400 ${loadingDevices ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                        </button>
                      </div>
                      
                      <div className="max-h-64 overflow-y-auto">
                        {devices.length === 0 ? (
                          <div className="p-4 text-center text-gray-500 text-sm">
                            Brak aktywnych urządzeń. Włącz Spotify na dowolnym urządzeniu.
                          </div>
                        ) : (
                          devices.map((device) => (
                            <button
                              key={device.id}
                              onClick={() => handleSelectDevice(device.id)}
                              className={`w-full p-3 text-left hover:bg-white/5 transition-colors flex items-center gap-3 ${
                                deviceId === device.id ? 'bg-green-500/10' : ''
                              }`}
                            >
                              <div className={deviceId === device.id ? 'text-green-400' : 'text-gray-400'}>
                                {device.type.toLowerCase() === 'computer' ? (
                                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25" />
                                  </svg>
                                ) : device.type.toLowerCase() === 'smartphone' ? (
                                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
                                  </svg>
                                ) : (
                                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
                                  </svg>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className={`truncate ${deviceId === device.id ? 'text-green-400' : 'text-white'}`}>
                                  {device.name}
                                </p>
                                <p className="text-xs text-gray-500 capitalize">{device.type}</p>
                              </div>
                              {deviceId === device.id && (
                                <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </button>
                          ))
                        )}
                      </div>
                      
                      <div className="p-2 border-t border-white/10">
                        <button
                          onClick={() => {
                            setShowDeviceMenu(false);
                            navigate('/device');
                          }}
                          className="w-full py-2 text-center text-sm text-gray-400 hover:text-white transition-colors"
                        >
                          Zarządzaj urządzeniami
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <button
                onClick={() => navigate('/')}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white"
                title="Menu główne"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </button>
            </div>
          </div>
        </nav>
      )}

      <div className={showNav ? 'pt-16' : ''}>
        {children}
      </div>

      {showDeviceMenu && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowDeviceMenu(false)}
        />
      )}
    </div>
  );
}
