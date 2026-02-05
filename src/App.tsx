import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Setup from './pages/Setup';
import Game from './pages/Game';
import Results from './pages/Results';
import Lobby from './pages/Lobby';
import { useGameStore } from './store/gameStore';

function ProtectedRoute({ children, status }: { children: React.ReactNode, status: string | string[] }) {
  const { gameStatus } = useGameStore();
  const allowed = Array.isArray(status) ? status.includes(gameStatus) : gameStatus === status;
  
  if (!allowed) return <Navigate to="/" />;
  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/home" element={<Home />} /> 
        
        <Route path="/setup" element={<Setup />} />
        
        <Route path="/lobby" element={
          <ProtectedRoute status="lobby">
            <Lobby />
          </ProtectedRoute>
        } />

        <Route path="/game" element={
          <ProtectedRoute status={['playing', 'lobby']}> {/* Allow lobby to transition to game */}
            <Game />
          </ProtectedRoute>
        } />
        
        <Route path="/results" element={
          <ProtectedRoute status="results">
             <Results />
          </ProtectedRoute>
        } />
        
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}
