import { useState } from 'react';
import Bottone from '../../componenti/Bottone';
import Input from '../../componenti/Input';
import { Plus, Square, LayoutTemplate } from 'lucide-react';
import { Sidebar as SidebarContainer, SidebarSection } from '../../componenti/Sidebar';

interface SidebarProps {
  roomDimensions: { width: number; height: number };
  setRoomDimensions: (dims: { width: number; height: number }) => void;
  creaStanza: () => void;
  onAddTable: (width: number, height: number) => void;
  onAddBancone: (width: number, height: number) => void;
  onAddDoor: () => void;
  className?: string;
}

export default function Sidebar({
  roomDimensions,
  setRoomDimensions,
  creaStanza,
  onAddTable,
  onAddBancone,
  onAddDoor,
  className = ''
}: SidebarProps) {
  // State for objects
  const [tableSize, setTableSize] = useState({ width: 1, height: 1 });
  const [banconeSize, setBanconeSize] = useState({ width: 2, height: 1 });

  return (
    <SidebarContainer className={className}>
      
      {/* Area Locale Section */}
      <SidebarSection 
        title="Area Locale" 
        icon={<LayoutTemplate className="w-5 h-5" />}
        defaultOpen={true}
      >
        <div className="grid grid-cols-2 gap-3">
          <Input 
              label="Larghezza (m)"
              type="number" 
              min="1"
              value={roomDimensions.width} 
              onChange={(e) => setRoomDimensions({...roomDimensions, width: parseFloat(e.target.value) || 0})}
              className="h-9"
          />
          <Input 
              label="Altezza (m)"
              type="number" 
              min="1"
              step="0.5"
              value={roomDimensions.height} 
              onChange={(e) => setRoomDimensions({...roomDimensions, height: parseFloat(e.target.value) || 0})}
              className="h-9"
          />
        </div>
        
        <div className="flex flex-col gap-2">
          <Bottone 
            variante="primario" 
            onClick={creaStanza}
            className="w-full justify-center"
          >
            Crea Stanza
          </Bottone>

          <Bottone 
            variante="secondario" 
            onClick={onAddDoor}
            className="w-full justify-center"
          >
            Aggiungi Porta (1m)
          </Bottone>
        </div>
      </SidebarSection>

      {/* Crea Oggetto Section */}
      <SidebarSection 
        title="Crea Oggetto" 
        icon={<Square className="w-5 h-5" />}
        defaultOpen={true}
      >
        {/* Aggiungi Tavolo */}
        <div className="flex flex-col gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
          <h3 className="font-semibold text-sm text-gray-700 flex items-center gap-2">
            <Plus className="w-4 h-4 text-orange-500" />
            Aggiungi Tavolo
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <Input 
                label="Largh. (m)"
                type="number" 
                min="0.5"
                step="0.25"
                value={tableSize.width}
                onChange={(e) => setTableSize({...tableSize, width: parseFloat(e.target.value) || 0})}
                className="h-8 text-sm"
            />
            <Input 
                label="Alt. (m)"
                type="number" 
                min="0.5"
                step="0.25"
                value={tableSize.height}
                onChange={(e) => setTableSize({...tableSize, height: parseFloat(e.target.value) || 0})}
                className="h-8 text-sm"
            />
          </div>
          <Bottone 
            variante="secondario" 
            onClick={() => onAddTable(tableSize.width, tableSize.height)}
            disabled={tableSize.width <= 0 || tableSize.height <= 0}
            className="w-full justify-center py-1.5 h-9 text-sm"
          >
            Aggiungi Tavolo
          </Bottone>
        </div>

        {/* Aggiungi Bancone */}
        <div className="flex flex-col gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100 mt-2">
          <h3 className="font-semibold text-sm text-gray-700 flex items-center gap-2">
            <Plus className="w-4 h-4 text-blue-500" />
            Aggiungi Bancone
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <Input 
                label="Largh. (m)"
                type="number" 
                min="0.5"
                step="0.25"
                value={banconeSize.width}
                onChange={(e) => setBanconeSize({...banconeSize, width: parseFloat(e.target.value) || 0})}
                className="h-8 text-sm"
            />
            <Input 
                label="Alt. (m)"
                type="number" 
                min="0.5"
                step="0.25"
                value={banconeSize.height}
                onChange={(e) => setBanconeSize({...banconeSize, height: parseFloat(e.target.value) || 0})}
                className="h-8 text-sm"
            />
          </div>
          <Bottone 
            variante="secondario" 
            onClick={() => onAddBancone(banconeSize.width, banconeSize.height)}
            disabled={banconeSize.width <= 0 || banconeSize.height <= 0}
            className="w-full justify-center py-1.5 h-9 text-sm"
          >
            Aggiungi Bancone
          </Bottone>
        </div>
      </SidebarSection>

    </SidebarContainer>
  );
}
