import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import Scheda from '../../componenti/Scheda';
import Input from '../../componenti/Input';
import Bottone from '../../componenti/Bottone';
import { ArrowLeft, UserPlus } from 'lucide-react';

export default function Registrazione() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    if (password !== confirmPassword) {
      setError('Le password non coincidono');
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;

      if (data.session) {
        navigate('/dashboard');
      } else if (data.user) {
        setSuccessMessage('Registrazione avvenuta con successo! Controlla la tua email per confermare l\'account.');
      }
    } catch (error: any) {
      setError(error.message || 'Errore durante la registrazione');
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
            <h1 className="text-2xl font-bold text-gray-900">Registrati</h1>
            <p className="text-gray-600 mt-2">Crea un nuovo account per gestire il tuo ristorante</p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-6 border border-red-100">
              {error}
            </div>
          )}

          {successMessage && (
            <div className="bg-green-50 text-green-600 p-3 rounded-lg text-sm mb-6 border border-green-100">
              {successMessage}
            </div>
          )}

          {!successMessage && (
            <form onSubmit={handleRegister} className="space-y-6">
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
                minLength={6}
              />

              <Input
                label="Conferma Password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
              />

              <Bottone
                type="submit"
                pienaLarghezza
                disabled={loading}
                className="flex items-center justify-center gap-2"
              >
                {loading ? (
                  'Registrazione in corso...'
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    Registrati
                  </>
                )}
              </Bottone>
            </form>
          )}

          <div className="mt-6 text-center text-sm text-gray-600">
            Hai già un account?{' '}
            <Link to="/login" className="text-[--primary] font-medium hover:underline">
              Accedi
            </Link>
          </div>
        </Scheda>
      </div>
    </div>
  );
}
