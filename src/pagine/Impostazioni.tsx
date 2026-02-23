import { Link } from 'react-router-dom';
import { ChefHat, PenTool, Settings, ArrowLeft } from 'lucide-react';
import Bottone from '../componenti/Bottone';
import Scheda from '../componenti/Scheda';
import Navbar from '../componenti/Navbar';

export default function Impostazioni() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      <div className="flex-1 p-4 sm:p-8 pt-32 max-w-7xl mx-auto w-full flex flex-col gap-12">
        <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-center gap-4 border-b border-gray-200 pb-4">
                <Link to="/dashboard">
                    <Bottone 
                        variante="fantasma"
                        className="p-2"
                    >
                        <ArrowLeft size={24} />
                    </Bottone>
                </Link>
                <div className="bg-[--accent] p-2 rounded-lg text-[--secondary]">
                    <Settings size={24} />
                </div>
                <h2 className="text-2xl font-bold text-[--secondary]">Impostazioni Ristorante</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Scheda interattiva className="flex flex-col items-center text-center h-full justify-between">
                    <div className="flex flex-col items-center">
                        <div className="bg-[--accent] p-4 rounded-full mb-6">
                            <PenTool size={32} className="text-[--secondary]" />
                        </div>
                        <h2 className="text-2xl font-semibold mb-3">Disegna Ristorante</h2>
                        <p className="text-gray-500 mb-6">Crea la piantina del tuo locale, posiziona i tavoli e organizza gli spazi.</p>
                    </div>
                    <Link to="/disegna" className="w-full mt-auto">
                        <Bottone pienaLarghezza>
                            Inizia a Disegnare
                        </Bottone>
                    </Link>
                </Scheda>

                <Scheda interattiva className="flex flex-col items-center text-center h-full justify-between">
                    <div className="flex flex-col items-center">
                        <div className="bg-[--accent] p-4 rounded-full mb-6">
                            <ChefHat size={32} className="text-[--secondary]" />
                        </div>
                        <h2 className="text-2xl font-semibold mb-3">Gestisci Menu</h2>
                        <p className="text-gray-500 mb-6">Crea e aggiorna il tuo menu digitale in tempo reale.</p>
                    </div>
                    <Link to="/gestione-menu" className="w-full mt-auto">
                        <Bottone pienaLarghezza variante="secondario">
                            Modifica Menu
                        </Bottone>
                    </Link>
                </Scheda>
            </div>
        </div>
      </div>
    </div>
  );
}
