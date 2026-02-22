import { Link } from 'react-router-dom';
import { LayoutTemplate, ArrowLeft, RotateCw, Trash2, Save, Menu } from 'lucide-react';
import Bottone from '../../componenti/Bottone';

interface StrumentiProps {
  selectedId: string | null;
  ruotaSelezionato: () => void;
  rimuoviSelezionato: () => void;
  onSave: () => void;
  onToggleSidebar: () => void;
}

export default function Strumenti({
  selectedId,
  ruotaSelezionato,
  rimuoviSelezionato,
  onSave,
  onToggleSidebar
}: StrumentiProps) {
  return (
    <div className="bg-white border-b border-gray-200 p-2 sm:p-4 flex items-center justify-between shadow-sm z-10 gap-3">
      {/* Top Bar: Title & Navigation */}
      <div className="flex items-center gap-2">
         <button 
           onClick={onToggleSidebar}
           className="p-1 text-gray-600 hover:bg-gray-100 rounded md:hidden"
           title="Menu Strumenti"
         >
           <Menu className="w-6 h-6" />
         </button>
         <Link to="/" className="text-gray-500 hover:text-[--secondary] p-1">
            <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
         </Link>
         <h1 className="text-lg sm:text-xl font-bold text-[--secondary] flex items-center gap-2">
            <LayoutTemplate className="w-5 h-5 sm:w-6 sm:h-6" />
            <span className="hidden sm:inline">Designer Sala</span>
            <span className="sm:hidden">Designer</span>
         </h1>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 sm:gap-3">
         <Bottone 
          variante="secondario"
          onClick={ruotaSelezionato}
          disabled={!selectedId}
          className="p-2"
          title="Ruota selezionato"
        >
          <RotateCw className="w-5 h-5" />
        </Bottone>

        <Bottone 
          variante="pericolo"
          onClick={rimuoviSelezionato}
          disabled={!selectedId}
          className="p-2"
          title="Elimina selezionato"
        >
          <Trash2 className="w-5 h-5" />
        </Bottone>
        
        <Bottone onClick={onSave} className="flex items-center gap-2 shadow-md">
          <Save className="w-4 h-4" />
          <span className="hidden sm:inline">Salva</span>
        </Bottone>
      </div>
    </div>
  );
}
