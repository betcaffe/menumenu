import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import DisegnaRistorante from './pagine/DisegnaRistorante';
import GestioneOrdini from './pagine/GestioneOrdini';
import GestioneMenu from './pagine/GestioneMenu';
import GestioneBar from './pagine/GestioneBar';
import GestioneCucina from './pagine/GestioneCucina';
import Home from './pagine/Home';
import Dashboard from './pagine/Dashboard';
import Impostazioni from './pagine/Impostazioni';
import GestioneComande from './pagine/GestioneComande';
import Login from './pagine/Auth/Login';
import Registrazione from './pagine/Auth/Registrazione';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div className="flex items-center justify-center h-screen">Caricamento...</div>;
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

function App() {
  return (
    <AuthProvider>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/impostazioni" element={
              <ProtectedRoute>
                <Impostazioni />
              </ProtectedRoute>
            } />
            <Route path="/gestione-comande" element={
              <ProtectedRoute>
                <GestioneComande />
              </ProtectedRoute>
            } />
            <Route path="/disegna" element={
              <ProtectedRoute>
                <DisegnaRistorante />
              </ProtectedRoute>
            } />
            <Route path="/login" element={<Login />} />
            <Route path="/registrazione" element={<Registrazione />} />
            <Route path="/gestione-ordini" element={
              <ProtectedRoute>
                <GestioneOrdini />
              </ProtectedRoute>
            } />
            <Route path="/gestione-menu" element={
              <ProtectedRoute>
                <GestioneMenu />
              </ProtectedRoute>
            } />
            <Route path="/gestione-bar" element={
              <ProtectedRoute>
                <GestioneBar />
              </ProtectedRoute>
            } />
            <Route path="/gestione-cucina" element={
              <ProtectedRoute>
                <GestioneCucina />
              </ProtectedRoute>
            } />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
