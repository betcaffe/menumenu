import { Link } from 'react-router-dom';
import { ChefHat, PenTool, ClipboardList } from 'lucide-react';
import Bottone from '../componenti/Bottone';
import Navbar from '../componenti/Navbar';
import DashboardCard from '../componenti/DashboardCard';
import { useAuth } from '../context/AuthContext';

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Navbar */}
      <Navbar 
        rightActions={
          !user && (
            <>
              <Link to="/login" className="text-gray-600 hover:text-gray-900 font-medium px-4">
                Accedi
              </Link>
              <Link to="/registrazione">
                <Bottone>Inizia Gratis</Bottone>
              </Link>
            </>
          )
        }
      />

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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              <DashboardCard
                title="Designer Sala"
                description="Disegna la piantina del tuo locale con un editor intuitivo. Posiziona tavoli, muri e ostacoli per ricreare fedelmente il tuo ambiente."
                icon={PenTool}
                variant="primario"
                iconClassName="bg-orange-100 text-[--primary]"
              />

              <DashboardCard
                title="Menu Digitale"
                description="Crea e aggiorna il tuo menu in tempo reale. Organizza piatti in categorie, gestisci prezzi e disponibilità con un click."
                icon={ChefHat}
                variant="secondario"
                iconClassName="bg-blue-100 text-[--secondary]"
              />

              <DashboardCard
                title="Gestione Ordini"
                description="Prendi le comande direttamente al tavolo. Il sistema calcola automaticamente i totali e mantiene aggiornato lo stato dei tavoli."
                icon={ClipboardList}
                variant="primario"
                iconClassName="bg-green-100 text-green-600"
              />
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
