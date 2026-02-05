import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Callback from './pages/Callback';
import DeviceSelect from './pages/DeviceSelect';
import ModeSelect from './pages/ModeSelect';
import Setup from './pages/Setup';
import JoinLobby from './pages/JoinLobby';
import Lobby from './pages/Lobby';
import Game from './pages/Game';
import Results from './pages/Results';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/callback" element={<Callback />} />
        <Route path="/device" element={<DeviceSelect />} />
        <Route path="/mode" element={<ModeSelect />} />
        <Route path="/setup" element={<Setup />} />
        <Route path="/join" element={<JoinLobby />} />
        <Route path="/lobby" element={<Lobby />} />
        <Route path="/game" element={<Game />} />
        <Route path="/results" element={<Results />} />
      </Routes>
    </BrowserRouter>
  );
}
