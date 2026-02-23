import { Settings, Layers } from 'lucide-react';
import Navbar from '../componenti/Navbar';
import DashboardCard from '../componenti/DashboardCard';

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 mt-20 sm:mt-24 w-full max-w-7xl mx-auto gap-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl w-full">
            <DashboardCard
                title="Impostazioni Ristorante"
                description="Disegna il tuo locale e gestisci il menu"
                icon={Settings}
                to="/impostazioni"
                buttonText="Apri Impostazioni"
                variant="primario"
                iconClassName="bg-[--accent] text-[--secondary]"
            />

            <DashboardCard
                title="Gestione Sala & Comande"
                description="Gestisci ordini, cucina e bar"
                icon={Layers}
                to="/gestione-comande"
                buttonText="Apri Gestione"
                variant="secondario"
                iconClassName="bg-blue-50 text-blue-600"
            />
        </div>
      </div>
    </div>
  );
}
