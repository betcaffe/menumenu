import { Link } from 'react-router-dom';
import { ChefHat, PenTool, ClipboardList, Utensils, Wine, Settings, Layers } from 'lucide-react';
import Bottone from '../componenti/Bottone';
import Scheda from '../componenti/Scheda';
import Navbar from '../componenti/Navbar';

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      <div className="flex-1 p-4 sm:p-8 pt-24 max-w-7xl mx-auto w-full flex flex-col gap-12">
        
        {/* Section 1: Impostazioni */}
        <div className="flex flex-col gap-6">
            <div className="flex items-center gap-3 border-b border-gray-200 pb-4">
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

        {/* Section 2: Gestisci Comande */}
        <div className="flex flex-col gap-6">
            <div className="flex items-center gap-3 border-b border-gray-200 pb-4">
                <div className="bg-blue-50 p-2 rounded-lg text-blue-600">
                    <Layers size={24} />
                </div>
                <h2 className="text-2xl font-bold text-[--secondary]">Gestione Sala & Comande</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Scheda interattiva className="flex flex-col items-center text-center h-full justify-between border-l-4 border-l-[--primary]">
                    <div className="flex flex-col items-center">
                        <div className="bg-[--accent] p-4 rounded-full mb-6">
                            <ClipboardList size={32} className="text-[--secondary]" />
                        </div>
                        <h2 className="text-2xl font-semibold mb-3">Gestione Ordini</h2>
                        <p className="text-gray-500 mb-6">Visualizza la sala e gestisci gli ordini in tempo reale.</p>
                    </div>
                    <Link to="/gestione-ordini" className="w-full mt-auto">
                        <Bottone pienaLarghezza>
                            Apri Sala
                        </Bottone>
                    </Link>
                </Scheda>

                <Scheda interattiva className="flex flex-col items-center text-center h-full justify-between border-l-4 border-l-orange-500">
                    <div className="flex flex-col items-center">
                        <div className="bg-orange-100 p-4 rounded-full mb-6">
                            <Utensils size={32} className="text-[--primary]" />
                        </div>
                        <h2 className="text-2xl font-semibold mb-3">Cucina</h2>
                        <p className="text-gray-500 mb-6">Visualizza le comande per la cucina in tempo reale.</p>
                    </div>
                    <Link to="/gestione-cucina" className="w-full mt-auto">
                        <Bottone pienaLarghezza variante="primario">
                            Apri Cucina
                        </Bottone>
                    </Link>
                </Scheda>

                <Scheda interattiva className="flex flex-col items-center text-center h-full justify-between border-l-4 border-l-blue-500">
                    <div className="flex flex-col items-center">
                        <div className="bg-blue-100 p-4 rounded-full mb-6">
                            <Wine size={32} className="text-[--secondary]" />
                        </div>
                        <h2 className="text-2xl font-semibold mb-3">Bar</h2>
                        <p className="text-gray-500 mb-6">Visualizza le comande per il bar in tempo reale.</p>
                    </div>
                    <Link to="/gestione-bar" className="w-full mt-auto">
                        <Bottone pienaLarghezza variante="secondario">
                            Apri Bar
                        </Bottone>
                    </Link>
                </Scheda>
            </div>
        </div>
      </div>
    </div>
  );
}
