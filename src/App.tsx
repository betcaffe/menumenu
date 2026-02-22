import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import DisegnaRistorante from './pagine/DisegnaRistorante';
import GestioneOrdini from './pagine/GestioneOrdini';
import GestioneMenu from './pagine/GestioneMenu';
import Home from './pagine/Home';
import Login from './pagine/Auth/Login';
import Registrazione from './pagine/Auth/Registrazione';

function App() {
  return (
    <AuthProvider>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/registrazione" element={<Registrazione />} />
            <Route path="/disegna" element={<DisegnaRistorante />} />
            <Route path="/gestione-ordini" element={<GestioneOrdini />} />
            <Route path="/gestione-menu" element={<GestioneMenu />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
