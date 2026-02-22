import { Link } from 'react-router-dom';
import { ChefHat, PenTool, ClipboardList, LayoutDashboard } from 'lucide-react';
import Bottone from '../componenti/Bottone';
import { useAuth } from '../context/AuthContext';

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Navbar */}
      <nav className="border-b border-gray-100 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ChefHat className="text-[--primary] h-8 w-8" />
            <span className="font-bold text-xl text-[--secondary]">MenuMenu</span>
          </div>
          <div className="flex items-center gap-4">
            {user ? (
              <Link to="/dashboard">
                <Bottone className="flex items-center gap-2">
                  <LayoutDashboard className="w-4 h-4" />
                  Vai alla Dashboard
                </Bottone>
              </Link>
            ) : (
              <>
                <Link to="/login" className="text-gray-600 hover:text-gray-900 font-medium">
                  Accedi
                </Link>
                <Link to="/registrazione">
                  <Bottone>Inizia Gratis</Bottone>
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-grow">
        <div className="relative overflow-hidden pt-16 pb-20 lg:pt-32 lg:pb-28">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
            <h1 className="text-5xl md:text-6xl font-extrabold text-[--secondary] tracking-tight mb-6">
              Gestisci il tuo ristorante<br />
              <span className="text-[--primary]">in modo intelligente</span>
            </h1>
            <p className="mt-4 text-xl text-gray-500 max-w-2xl mx-auto mb-10">
              Dalla creazione della piantina alla gestione degli ordini in tempo reale. 
              Tutto quello che ti serve per ottimizzare il tuo locale, in un'unica piattaforma.
            </p>
            <div className="flex justify-center gap-4">
              {user ? (
                <Link to="/dashboard">
                  <Bottone dimensione="lg" className="shadow-lg hover:shadow-xl transform transition-all hover:-translate-y-1">
                    Accedi alla Dashboard
                  </Bottone>
                </Link>
              ) : (
                <Link to="/registrazione">
                  <Bottone dimensione="lg" className="shadow-lg hover:shadow-xl transform transition-all hover:-translate-y-1">
                    Crea il tuo Account
                  </Bottone>
                </Link>
              )}
            </div>
          </div>
          
          {/* Decorative background elements */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full overflow-hidden -z-10 pointer-events-none opacity-10">
            <div className="absolute top-20 left-10 w-72 h-72 bg-[--primary] rounded-full blur-3xl mix-blend-multiply animate-blob"></div>
            <div className="absolute top-20 right-10 w-72 h-72 bg-[--secondary] rounded-full blur-3xl mix-blend-multiply animate-blob animation-delay-2000"></div>
          </div>
        </div>

        {/* Features Section */}
        <div className="bg-gray-50 py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-[--secondary]">Tutto ciò di cui hai bisogno</h2>
              <p className="mt-4 text-gray-500">Funzionalità potenti per semplificare il tuo lavoro quotidiano</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="bg-orange-100 w-12 h-12 rounded-xl flex items-center justify-center mb-6">
                  <PenTool className="text-[--primary] w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Designer Sala</h3>
                <p className="text-gray-500">
                  Disegna la piantina del tuo locale con un editor intuitivo. 
                  Posiziona tavoli, muri e ostacoli per ricreare fedelmente il tuo ambiente.
                </p>
              </div>

              <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="bg-blue-100 w-12 h-12 rounded-xl flex items-center justify-center mb-6">
                  <ChefHat className="text-[--secondary] w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Menu Digitale</h3>
                <p className="text-gray-500">
                  Crea e aggiorna il tuo menu in tempo reale. 
                  Organizza piatti in categorie, gestisci prezzi e disponibilità con un click.
                </p>
              </div>

              <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="bg-green-100 w-12 h-12 rounded-xl flex items-center justify-center mb-6">
                  <ClipboardList className="text-green-600 w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Gestione Ordini</h3>
                <p className="text-gray-500">
                  Prendi le comande direttamente al tavolo. 
                  Il sistema calcola automaticamente i totali e mantiene aggiornato lo stato dei tavoli.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-400">
          <p>&copy; {new Date().getFullYear()} MenuMenu. Tutti i diritti riservati.</p>
        </div>
      </footer>
    </div>
  );
}
