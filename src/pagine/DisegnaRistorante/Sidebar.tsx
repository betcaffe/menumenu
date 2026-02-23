import { useState } from 'react';
import Bottone from '../../componenti/Bottone';
import Input from '../../componenti/Input';
import { Plus, Square, LayoutTemplate } from 'lucide-react';
import { Sidebar as SidebarContainer, SidebarSection } from '../../componenti/Sidebar';

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
      >
        <Input 
            label="Nome Oggetto"
            type="text" 
            placeholder="Es. Tavolo VIP"
            value={customObj.name}
            onChange={(e) => setCustomObj({...customObj, name: e.target.value})}
            className="h-9"
        />

        <div className="grid grid-cols-2 gap-3">
          <Input 
              label="Larghezza (m)"
              type="number" 
              min="0.5"
              step="0.5"
              value={customObj.width}
              onChange={(e) => setCustomObj({...customObj, width: parseFloat(e.target.value) || 0})}
              className="h-9"
          />
          <Input 
              label="Altezza (m)"
              type="number" 
              min="0.5"
              step="0.5"
              value={customObj.height}
              onChange={(e) => setCustomObj({...customObj, height: parseFloat(e.target.value) || 0})}
              className="h-9"
          />
        </div>
        
        <Bottone 
          variante="secondario" 
          onClick={handleAddObject}
          disabled={!customObj.name || customObj.width <= 0 || customObj.height <= 0}
          className="w-full justify-center flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Aggiungi
        </Bottone>
      </SidebarSection>

    </SidebarContainer>
  );
}
