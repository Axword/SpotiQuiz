import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import { exchangeToken } from '../lib/spotify';
import { Layout } from '../components/Layout';
import { translations } from '../lib/translations';

const Callback = () => {
  const navigate = useNavigate();
  const { setToken } = useGameStore();
  const t = translations[useGameStore.getState().language];

  useEffect(() => {
    const handleAuthCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');

      if (code) {
        try {
          const response = await exchangeToken(code);
          setToken(response.access_token);
          // Optionally fetch user info here
          navigate('/');
        } catch (error) {
          console.error('Auth failed:', error);
          // Handle error
        }
      } else {
        // No code, redirect to home
        navigate('/');
      }
    };

    handleAuthCallback();
  }, [navigate, setToken]);

  return (
    <Layout>
      <div className="flex flex-col items-center justify-center h-screen text-center">
        <h1 className="text-4xl font-bold mb-4">{t.loading}</h1>
        <p className="text-gray-400">{t.authenticating}</p>
      </div>
    </Layout>
  );
};

export default Callback;