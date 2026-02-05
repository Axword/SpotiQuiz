import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Setup from './pages/Setup';
import Game from './pages/Game';
import Results from './pages/Results';
import { useGameStore } from './store/gameStore';

function GameRoute({ children }: { children: React.ReactNode }) {
  const { isGameActive } = useGameStore();
  // If game is not active, redirect to setup or home.
  // But allow if we are just navigating.
  if (!isGameActive) return <Navigate to="/setup" />;
  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/home" element={<Home />} /> {/* Handle Redirect URI ending in /home */}
        
        <Route path="/setup" element={<Setup />} />
        
        <Route path="/game" element={
          <GameRoute>
            <Game />
          </GameRoute>
        } />
        
        <Route path="/results" element={<Results />} />
        
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}
