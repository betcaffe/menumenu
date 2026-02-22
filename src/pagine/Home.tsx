import { Link } from 'react-router-dom';
import { ChefHat, PenTool, ClipboardList } from 'lucide-react';
import Bottone from '../componenti/Bottone';
import Scheda from '../componenti/Scheda';

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50">
      <header className="mb-12 text-center">
        <h1 className="text-5xl font-bold text-[--secondary] mb-4 flex items-center justify-center gap-3">
          <ChefHat size={48} className="text-[--primary]" />
          MenuMenu
        </h1>
        <p className="text-xl text-gray-600">Gestisci il tuo ristorante in modo semplice e veloce</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl w-full">
        <Scheda interattiva className="flex flex-col items-center text-center">
          <div className="bg-[--accent] p-4 rounded-full mb-6">
            <PenTool size={32} className="text-[--secondary]" />
          </div>
          <h2 className="text-2xl font-semibold mb-3">Disegna Ristorante</h2>
          <p className="text-gray-500 mb-6">Crea la piantina del tuo locale, posiziona i tavoli e organizza gli spazi.</p>
          <Link to="/disegna" className="w-full">
            <Bottone pienaLarghezza>
              Inizia a Disegnare
            </Bottone>
          </Link>
        </Scheda>

        <Scheda interattiva className="flex flex-col items-center text-center">
          <div className="bg-[--accent] p-4 rounded-full mb-6">
            <ClipboardList size={32} className="text-[--secondary]" />
          </div>
          <h2 className="text-2xl font-semibold mb-3">Gestione Ordini</h2>
          <p className="text-gray-500 mb-6">Visualizza la sala e gestisci gli ordini in tempo reale.</p>
          <Link to="/gestione-ordini" className="w-full">
            <Bottone pienaLarghezza>
              Apri Sala
            </Bottone>
          </Link>
        </Scheda>

        <Scheda interattiva className="flex flex-col items-center text-center">
          <div className="bg-[--accent] p-4 rounded-full mb-6">
            <ChefHat size={32} className="text-[--secondary]" />
          </div>
          <h2 className="text-2xl font-semibold mb-3">Gestisci Menu</h2>
          <p className="text-gray-500 mb-6">Crea e aggiorna il tuo menu digitale in tempo reale.</p>
          <Link to="/gestione-menu" className="w-full">
            <Bottone pienaLarghezza variante="secondario">
              Modifica Menu
            </Bottone>
          </Link>
        </Scheda>
      </div>
    </div>
  );
}
