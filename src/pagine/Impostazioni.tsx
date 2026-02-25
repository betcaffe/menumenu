import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChefHat, PenTool, LayoutGrid } from 'lucide-react';
import Navbar from '../componenti/Navbar';
import DashboardCard from '../componenti/DashboardCard';
import MobileStickyBar from '../componenti/MobileStickyBar';

export default function Impostazioni() {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to Gestione Menu on mobile
    if (window.innerWidth < 768) {
      navigate('/gestione-menu');
    }
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 mt-20 sm:mt-24 w-full max-w-7xl mx-auto gap-12 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl w-full">
                <DashboardCard
                    title="Gestisci Menu"
                    description="Crea e aggiorna il tuo menu digitale in tempo reale."
                    icon={ChefHat}
                    to="/gestione-menu"
                    buttonText="Modifica Menu"
                    variant="primario"
                    iconClassName="bg-[--accent] text-[--secondary]"
                />

                <DashboardCard
                    title="Disegna Ristorante"
                    description="Crea la piantina del tuo locale, posiziona i tavoli e organizza gli spazi."
                    icon={PenTool}
                    to="/disegna"
                    buttonText="Inizia a Disegnare"
                    variant="secondario"
                    iconClassName="bg-[--accent] text-[--secondary]"
                />
        </div>
      </div>

      <MobileStickyBar
        activeKey="impostazioni"
        defaultInactiveClass="bg-[--secondary] text-white"
        defaultActiveClass="bg-[--primary] text-white"
        items={[
          { key: 'menu', to: '/gestione-menu', label: 'Menu', icon: <ChefHat className="w-6 h-6" /> },
          { key: 'disegna', to: '/disegna', label: 'Disegna', icon: <PenTool className="w-6 h-6" /> },
        ]}
      />
    </div>
  );
}
