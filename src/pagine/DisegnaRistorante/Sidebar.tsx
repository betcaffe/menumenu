import { useState } from 'react';
import Bottone from '../../componenti/Bottone';
import { Plus, Square, LayoutTemplate } from 'lucide-react';

interface SidebarProps {
  roomDimensions: { width: number; height: number };
  setRoomDimensions: (dims: { width: number; height: number }) => void;
  creaStanza: () => void;
  onAddObject: (name: string, width: number, height: number) => void;
  onAddDoor: () => void;
  className?: string;
}

export default function Sidebar({
  roomDimensions,
  setRoomDimensions,
  creaStanza,
  onAddObject,
  onAddDoor,
  className = ''
}: SidebarProps) {
  // State for custom object creation
  const [customObj, setCustomObj] = useState({
    name: '',
    width: 1,
    height: 1
  });

  const handleAddObject = () => {
    if (customObj.name && customObj.width > 0 && customObj.height > 0) {
      onAddObject(customObj.name, customObj.width, customObj.height);
      // Optional: reset name but keep dimensions?
      setCustomObj(prev => ({ ...prev, name: '' }));
    }
  };

  return (
    <div className={`bg-white border-r border-gray-200 p-4 flex flex-col gap-6 overflow-y-auto ${className}`}>
      
      {/* Area Locale Section */}
      <div className="flex flex-col gap-3">
        <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2">
          <LayoutTemplate className="w-4 h-4" />
          Area Locale
        </h3>
        
        <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500 font-medium">Larghezza (m)</label>
              <input 
                type="number" 
                min="1"
                value={roomDimensions.width} 
                onChange={(e) => setRoomDimensions({...roomDimensions, width: parseFloat(e.target.value) || 0})}
                className="w-full text-sm border border-gray-300 rounded p-1.5 focus:border-[--secondary] focus:outline-none"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500 font-medium">Altezza (m)</label>
              <input 
                type="number" 
                min="1"
                step="0.5"
                value={roomDimensions.height} 
                onChange={(e) => setRoomDimensions({...roomDimensions, height: parseFloat(e.target.value) || 0})}
                className="w-full text-sm border border-gray-300 rounded p-1.5 focus:border-[--secondary] focus:outline-none"
              />
            </div>
          </div>
          
          <Bottone 
            variante="primario" 
            dimensione="sm"
            onClick={creaStanza}
            className="w-full justify-center"
          >
            Crea Stanza
          </Bottone>

          <Bottone 
            variante="secondario" 
            dimensione="sm"
            onClick={onAddDoor}
            className="w-full justify-center"
          >
            Aggiungi Porta (1m)
          </Bottone>
        </div>
      </div>

      <div className="h-px bg-gray-200"></div>

      {/* Crea Oggetto Section */}
      <div className="flex flex-col gap-3">
        <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2">
          <Square className="w-4 h-4" />
          Crea Oggetto
        </h3>
        
        <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500 font-medium">Nome Oggetto</label>
            <input 
              type="text" 
              placeholder="Es. Tavolo VIP"
              value={customObj.name}
              onChange={(e) => setCustomObj({...customObj, name: e.target.value})}
              className="w-full text-sm border border-gray-300 rounded p-1.5 focus:border-[--secondary] focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500 font-medium">Larghezza (m)</label>
              <input 
                type="number" 
                min="0.5"
                step="0.5"
                value={customObj.width}
                onChange={(e) => setCustomObj({...customObj, width: parseFloat(e.target.value) || 0})}
                className="w-full text-sm border border-gray-300 rounded p-1.5 focus:border-[--secondary] focus:outline-none"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500 font-medium">Altezza (m)</label>
              <input 
                type="number" 
                min="0.5"
                step="0.5"
                value={customObj.height}
                onChange={(e) => setCustomObj({...customObj, height: parseFloat(e.target.value) || 0})}
                className="w-full text-sm border border-gray-300 rounded p-1.5 focus:border-[--secondary] focus:outline-none"
              />
            </div>
          </div>
          
          <Bottone 
            variante="secondario" 
            dimensione="sm"
            onClick={handleAddObject}
            disabled={!customObj.name || customObj.width <= 0 || customObj.height <= 0}
            className="w-full justify-center flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Aggiungi
          </Bottone>
        </div>
      </div>

    </div>
  );
}
