import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import Scheda from '../../componenti/Scheda';
import Input from '../../componenti/Input';
import Bottone from '../../componenti/Bottone';
import { ArrowLeft, LogIn } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      navigate('/dashboard');
    } catch (error: any) {
      setError(error.message || 'Errore durante il login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link to="/" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Torna alla Home
        </Link>
        
        <Scheda className="p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Accedi</h1>
            <p className="text-gray-600 mt-2">Inserisci le tue credenziali per accedere</p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-6 border border-red-100">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nome@esempio.com"
              required
            />
            
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />

            <Bottone
              type="submit"
              pienaLarghezza
              disabled={loading}
              className="flex items-center justify-center gap-2"
            >
              {loading ? (
                'Accesso in corso...'
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  Accedi
                </>
              )}
            </Bottone>
          </form>

          <div className="mt-6 text-center text-sm text-gray-600">
            Non hai un account?{' '}
            <Link to="/registrazione" className="text-[--primary] font-medium hover:underline">
              Registrati
            </Link>
          </div>
        </Scheda>
      </div>
    </div>
  );
}
