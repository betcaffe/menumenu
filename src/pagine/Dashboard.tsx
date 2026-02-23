import { Link } from 'react-router-dom';
import { Settings, Layers } from 'lucide-react';
import Scheda from '../componenti/Scheda';
import Navbar from '../componenti/Navbar';

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      <div className="flex-1 p-4 sm:p-8 pt-32 max-w-7xl mx-auto w-full flex flex-col gap-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto w-full">
            <Link to="/impostazioni" className="block h-full">
                <Scheda 
                    interattiva 
                    className="flex flex-col items-center text-center p-8 hover:scale-105 transition-transform duration-300 h-full justify-center"
                >
                    <div className="bg-[--accent] p-6 rounded-full mb-6 text-[--secondary]">
                        <Settings size={48} />
                    </div>
                    <h2 className="text-3xl font-bold text-[--secondary] mb-4">Impostazioni Ristorante</h2>
                    <p className="text-gray-500 text-lg">Disegna il tuo locale e gestisci il menu</p>
                </Scheda>
            </Link>

            <Link to="/gestione-comande" className="block h-full">
                <Scheda 
                    interattiva 
                    className="flex flex-col items-center text-center p-8 hover:scale-105 transition-transform duration-300 h-full justify-center"
                >
                    <div className="bg-blue-50 p-6 rounded-full mb-6 text-blue-600">
                        <Layers size={48} />
                    </div>
                    <h2 className="text-3xl font-bold text-[--secondary] mb-4">Gestione Sala & Comande</h2>
                    <p className="text-gray-500 text-lg">Gestisci ordini, cucina e bar</p>
                </Scheda>
            </Link>
        </div>
      </div>
    </div>
  );
}
