import { Link } from 'react-router-dom';
import { ClipboardList, Utensils, Wine, Layers, ArrowLeft } from 'lucide-react';
import Navbar from '../componenti/Navbar';
import DashboardCard from '../componenti/DashboardCard';

export default function GestioneComande() {
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl w-full">
                <DashboardCard
                    title="Gestione Ordini"
                    description="Visualizza la sala e gestisci gli ordini in tempo reale."
                    icon={ClipboardList}
                    to="/gestione-ordini"
                    buttonText="Apri Sala"
                    variant="primario"
                    iconClassName="bg-[--accent] text-[--secondary]"
                />

                <DashboardCard
                    title="Cucina"
                    description="Visualizza le comande per la cucina in tempo reale."
                    icon={Utensils}
                    to="/gestione-cucina"
                    buttonText="Apri Cucina"
                    variant="primario"
                    iconClassName="bg-orange-100 text-[--primary]"
                />

                <DashboardCard
                    title="Bar"
                    description="Visualizza le comande per il bar in tempo reale."
                    icon={Wine}
                    to="/gestione-bar"
                    buttonText="Apri Bar"
                    variant="secondario"
                    iconClassName="bg-blue-100 text-[--secondary]"
                />
        </div>
      </div>
    </div>
  );
}
