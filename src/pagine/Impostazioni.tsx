import { Link } from 'react-router-dom';
import { ChefHat, PenTool, ArrowLeft } from 'lucide-react';
import Navbar from '../componenti/Navbar';
import DashboardCard from '../componenti/DashboardCard';

export default function Impostazioni() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar 
        leftActions={
           <Link to="/dashboard" className="text-gray-500 hover:text-[--secondary] p-1">
             <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
           </Link>
        }
      />

      <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 mt-20 sm:mt-24 w-full max-w-7xl mx-auto gap-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl w-full">
                <DashboardCard
                    title="Disegna Ristorante"
                    description="Crea la piantina del tuo locale, posiziona i tavoli e organizza gli spazi."
                    icon={PenTool}
                    to="/disegna"
                    buttonText="Inizia a Disegnare"
                    variant="primario"
                    iconClassName="bg-[--accent] text-[--secondary]"
                />

                <DashboardCard
                    title="Gestisci Menu"
                    description="Crea e aggiorna il tuo menu digitale in tempo reale."
                    icon={ChefHat}
                    to="/gestione-menu"
                    buttonText="Modifica Menu"
                    variant="secondario"
                    iconClassName="bg-[--accent] text-[--secondary]"
                />
        </div>
      </div>
    </div>
  );
}
