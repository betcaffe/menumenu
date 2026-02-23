import { useState, useRef, useEffect } from 'react';
import { Stage, Layer, Rect, Transformer, Group } from 'react-konva';
import Konva from 'konva';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../supabaseClient';
import { Elemento, GRID_SIZE } from './types';
import Sidebar from './Sidebar';
import Griglia from './Griglia';
import ElementoCanvas from './ElementoCanvas';
import Navbar from '../../componenti/Navbar';
import { ArrowLeft, Menu, RotateCw, Trash2, Save, PenTool } from 'lucide-react';
import { Link } from 'react-router-dom';
import Bottone from '../../componenti/Bottone';

export default function DisegnaRistorante() {
  const { user } = useAuth();
  const [elementi, setElementi] = useState<Elemento[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [stageSize, setStageSize] = useState({ width: 800, height: 2000 });
  const [roomDimensions, setRoomDimensions] = useState({ width: 10, height: 5 });
  const [showSidebar, setShowSidebar] = useState(false);
  const [scale, setScale] = useState(1);
  const [contentOffset, setContentOffset] = useState({ x: 0, y: 0 });
  const [isLayoutReady, setIsLayoutReady] = useState(false);
  
  // Calculate scale based on screen width on initial load
  // If width < 800px (Mobile), use 2 cells per meter (40px)
  // Otherwise use 4 cells per meter (80px)
  const [cellsPerMeter, setCellsPerMeter] = useState(() => {
    if (typeof window !== 'undefined') {
       // Default initial scale
       const width = window.innerWidth;
       const availableCells = Math.floor(width / GRID_SIZE);
       
       // Heuristic: If we have ~40 cells, 4 cells/m means 10m visible width.
       // This is a reasonable default.
       if (availableCells >= 40) return 4;
       if (availableCells >= 20) return 2;
       return 1;
    }
    return 4;
  });
  
  const pixelsPerMeter = cellsPerMeter * GRID_SIZE;

  const containerRef = useRef<HTMLDivElement>(null);
  const transformerRef = useRef<Konva.Transformer>(null);

  // Aggiorna dimensioni stage e scala solo se necessario per far entrare il contenuto (Mobile fix)
  useEffect(() => {
    let animationFrameId: number;

    const handleResize = () => {
      if (containerRef.current) {
        // Use full width of container
        const width = containerRef.current.offsetWidth;
        const height = containerRef.current.offsetHeight;
        
        // Wrap state updates in a single frame to prevent flickering
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
        
        animationFrameId = requestAnimationFrame(() => {
            setStageSize({ width, height });
            
            // Calcola bounding box del contenuto
            if (elementi.length > 0) {
                let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
                
                elementi.forEach(el => {
                    minX = Math.min(minX, el.x);
                    minY = Math.min(minY, el.y);
                    maxX = Math.max(maxX, el.x + (el.width || 0));
                    maxY = Math.max(maxY, el.y + (el.height || 0));
                });
                
                // Convert everything to pixels for layout calculation
                const minX_px = minX * pixelsPerMeter;
                const minY_px = minY * pixelsPerMeter;
                const maxX_px = maxX * pixelsPerMeter;
                const maxY_px = maxY * pixelsPerMeter;
    
                const contentHeight = maxY_px - minY_px;
                const contentBottom = maxY_px + 20;
                
                const PADDING = 20;
                const contentRight = maxX_px + PADDING;
                
                // Calcola scale per far entrare tutto (basato su origine 0,0)
                const scaleX = width / contentRight;
                const scaleY = height / contentBottom;
                
                // Prendi il minore per assicurarti che entri sia in larghezza che altezza
                let newScale = Math.min(scaleX, scaleY);
                
                // IMPORTANTE: Non zoomare mai in avanti (ingrandire), solo indietro (rimpicciolire) se serve.
                // Se c'è spazio, lascia scale a 1.
                if (newScale > 1) newScale = 1;
                
                // Evita scale troppo piccoli (es. 0)
                if (newScale < 0.1) newScale = 0.1;
    
                setScale(newScale);
    
                // Align left (with small padding) instead of centering horizontally
                // But keep vertical centering
                const PADDING_LEFT = 20; // Distance from sidebar
                const alignedX = PADDING_LEFT - minX_px * newScale;
                const centeredY = (height - contentHeight * newScale) / 2 - minY_px * newScale;
                
                setContentOffset({ 
                    x: alignedX, 
                    y: centeredY 
                });
                
                setIsLayoutReady(true);
            } else {
                // Default
                setScale(1);
                setContentOffset({ x: 0, y: 0 });
                setIsLayoutReady(true);
            }
        });
      }
    };
    
    // Initial call
    handleResize();

    window.addEventListener('resize', handleResize);
    // Add delay to ensure container is ready
    const timer = setTimeout(handleResize, 100);
    const timer2 = setTimeout(handleResize, 500); // Double check for slow renders
    
    return () => {
        window.removeEventListener('resize', handleResize);
        clearTimeout(timer);
        clearTimeout(timer2);
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [elementi]); // Re-run when elements change

  // Load layout from Supabase on mount
  useEffect(() => {
    if (!user) return;

    const loadLayout = async () => {
      try {
        const { data, error } = await supabase
          .from('restaurants')
          .select('layout')
          .eq('user_id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
           console.error("Error loading layout:", error);
           return;
        }

        if (data?.layout) {
          // Supabase returns JSONB as object
          const parsed = data.layout as any; 
          
          if (parsed.elementi && parsed.roomDimensions) {
            let loadedElements = parsed.elementi as Elemento[];
            
            // Normalize legacy data (pixels -> meters)
            // Assume standard desktop scale (80px = 1m) for legacy conversion
            const LEGACY_PPM = 80;
            
            loadedElements = loadedElements.map((el: any) => {
                if (el.normalized) return el;
                return {
                    ...el,
                    x: el.x / LEGACY_PPM,
                    y: el.y / LEGACY_PPM,
                    width: el.width ? el.width / LEGACY_PPM : undefined,
                    height: el.height ? el.height / LEGACY_PPM : undefined,
                    fontSize: el.fontSize ? el.fontSize / LEGACY_PPM : undefined,
                    normalized: true
                } as Elemento;
            });

            setElementi(loadedElements);
            setRoomDimensions(parsed.roomDimensions);
          }
        }
      } catch (e) {
        console.error("Failed to load layout", e);
      }
    };

    loadLayout();
  }, [user]);

  const salvaLayout = async () => {
    if (!user) {
        alert('Devi essere loggato per salvare.');
        return;
    }

    const layoutData = {
      elementi,
      roomDimensions,
      timestamp: Date.now()
    };

    try {
        // Upsert restaurant based on user_id
        // We assume one restaurant per user for now
        const { error } = await supabase
            .from('restaurants')
            .upsert({ 
                user_id: user.id, 
                layout: layoutData,
                updated_at: new Date().toISOString()
            }, { onConflict: 'user_id' });

        if (error) {
            console.error('Error saving layout:', error);
            alert('Errore nel salvataggio del layout.');
        } else {
            alert('Layout salvato su Supabase!');
        }
    } catch (e) {
        console.error('Exception saving layout:', e);
        alert('Errore imprevisto nel salvataggio.');
    }
  };

  const aggiungiElemento = (type: 'rect' | 'wall' | 'door', customProps?: { width?: number, height?: number, label?: string }) => {
    const isWall = type === 'wall';
    // Snap initial position to grid (in meters)
    // Assume start at 1.25m (approx 100px / 80px)
    const startX = 2.0; 
    const startY = 2.0;
    
    // Default sizes in meters
    let width, height;
    
    if (customProps?.width && customProps?.height) {
        width = customProps.width; // Already in meters
        height = customProps.height;
    } else {
        // Table: 1x1 meter
        // Wall: length 1 meter, thickness 0.25m (1 cell)
        // Door: 1 meter x thickness
        const WALL_THICKNESS = 0.25;
        
        if (type === 'door') {
           width = 1.0; // 1 meter wide
           height = WALL_THICKNESS; 
        } else {
           width = isWall ? 1.0 : 1.0;
           height = isWall ? WALL_THICKNESS : 1.0;
        }
    }

    const newElement: Elemento = {
      id: `el-${Date.now()}`,
      x: startX,
      y: startY,
      type,
      width,
      height,
      label: customProps?.label || (isWall ? undefined : (type === 'door' ? 'Porta' : `T${elementi.filter(e => e.type === 'rect').length + 1}`)),
      rotation: 0,
      normalized: true
    };
    setElementi([...elementi, newElement]);
  };

  const creaStanza = () => {
    // 1. Get container dimensions
    const containerWidth = containerRef.current?.offsetWidth || window.innerWidth;
    const containerHeight = containerRef.current?.offsetHeight || window.innerHeight;

    // 2. Define margins (3 cells padding on all sides approx)
    const marginPixels = 3 * GRID_SIZE;
    const availableWidth = containerWidth - (marginPixels * 2);
    const availableHeight = containerHeight - (marginPixels * 2);

    // 3. Calculate required pixels per meter to fit width and height
    const pixelsPerMeterX = availableWidth / roomDimensions.width;
    const pixelsPerMeterY = availableHeight / roomDimensions.height;

    // 4. Choose the smaller scale to ensure it fits both dimensions
    let newPixelsPerMeter = Math.min(pixelsPerMeterX, pixelsPerMeterY);
    
    // Clamp to a reasonable maximum (standard view) so small rooms don't explode
    newPixelsPerMeter = Math.min(newPixelsPerMeter, 4 * GRID_SIZE);

    // Update state for future elements
    setCellsPerMeter(newPixelsPerMeter / GRID_SIZE);

    // 5. Create Room Elements (in METERS)
    const WALL_THICKNESS = 0.25; // 25cm
    
    // Start position: 1 meter from top/left (arbitrary logical position)
    const startX = 1.0; 
    const startY = 1.0;

    // Room is a single object (Rect with stroke)
    const roomElement: Elemento = {
        id: `room-${Date.now()}`,
        x: startX - WALL_THICKNESS/2,
        y: startY - WALL_THICKNESS/2,
        type: 'room',
        width: roomDimensions.width + WALL_THICKNESS,
        height: roomDimensions.height + WALL_THICKNESS,
        rotation: 0,
        normalized: true
    };

    // Replace existing elements to start fresh with the new scale
    // Removed dimension labels as requested
    setElementi([roomElement]);
  };

  const rimuoviSelezionato = () => {
    if (selectedId) {
      setElementi(elementi.filter(e => e.id !== selectedId));
      setSelectedId(null);
    }
  };

  const ruotaSelezionato = () => {
    if (selectedId) {
      setElementi(prev => prev.map(el => {
        if (el.id === selectedId) {
          // Rotate 90 degrees
          const newRotation = (el.rotation || 0) + 90;
          return { ...el, rotation: newRotation };
        }
        return el;
      }));
    }
  };

  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>, id: string) => {
    // 1. Get current position in pixels (relative to Group)
    const px = e.target.x();
    const py = e.target.y();
    
    // 2. Convert to meters
    const mx = px / pixelsPerMeter;
    const my = py / pixelsPerMeter;

    // 3. Define snap unit in meters
    // GRID_SIZE is 20px. pixelsPerMeter is e.g. 80px. SNAP = 0.25m.
    const SNAP = GRID_SIZE / pixelsPerMeter;

    const draggedEl = elementi.find(el => el.id === id);
    
    // DOOR SNAPPING LOGIC
    if (draggedEl?.type === 'door') {
        const room = elementi.find(el => el.type === 'room');
        if (room) {
            // Room coordinates are in meters
            const rx = room.x;
            const ry = room.y;
            const rw = room.width || 0;
            const rh = room.height || 0;
            
            const walls = [
                { name: 'top', y: ry, x1: rx, x2: rx + rw, vertical: false },
                { name: 'bottom', y: ry + rh, x1: rx, x2: rx + rw, vertical: false },
                { name: 'left', x: rx, y1: ry, y2: ry + rh, vertical: true },
                { name: 'right', x: rx + rw, y1: ry, y2: ry + rh, vertical: true }
            ];

            let minDist = Infinity;
            let closestWall = null;
            let snapX = mx;
            let snapY = my;
            let snapRotation = 0;

            walls.forEach(wall => {
                let dist, px, py;
                if (wall.vertical) {
                    const doorLength = draggedEl.width || 0;
                    const validY1 = wall.y1!;
                    const validY2 = wall.y2! - doorLength;
                    
                    py = Math.max(wall.y1!, Math.min(my, wall.y2!));
                    px = wall.x!;
                    dist = Math.sqrt(Math.pow(mx - px, 2) + Math.pow(my - py, 2));
                    
                    if (dist < minDist) {
                        minDist = dist;
                        closestWall = wall;
                        snapX = px; 
                        snapY = Math.max(validY1, Math.min(my, validY2));
                        snapRotation = 90;
                    }
                } else {
                    const doorLength = draggedEl.width || 0;
                    const validX1 = wall.x1!;
                    const validX2 = wall.x2! - doorLength;

                    px = Math.max(wall.x1!, Math.min(mx, wall.x2!));
                    py = wall.y!;
                    dist = Math.sqrt(Math.pow(mx - px, 2) + Math.pow(my - py, 2));

                    if (dist < minDist) {
                        minDist = dist;
                        closestWall = wall;
                        snapX = Math.max(validX1, Math.min(mx, validX2));
                        snapY = py; 
                        snapRotation = 0;
                    }
                }
            });

            if (closestWall) {
                // Apply offsets to align thickness
                // SNAP is used as wall thickness here (0.25m)
                if (snapRotation === 90) {
                     snapX += SNAP/2;
                } else {
                     snapY -= SNAP/2;
                }
            }
            
            // Update Konva node (back to pixels)
            e.target.x(snapX * pixelsPerMeter);
            e.target.y(snapY * pixelsPerMeter);
            e.target.rotation(snapRotation);

            setElementi(prev => prev.map(el => {
              if (el.id === id) {
                return { ...el, x: snapX, y: snapY, rotation: snapRotation };
              }
              return el;
            }));
            return;
        }
    }

    // Standard Snap
    const x = Math.round(mx / SNAP) * SNAP;
    const y = Math.round(my / SNAP) * SNAP;

    e.target.x(x * pixelsPerMeter);
    e.target.y(y * pixelsPerMeter);
    
    setElementi(prev => prev.map(el => {
      if (el.id === id) {
        return { ...el, x, y };
      }
      return el;
    }));
  };

  const handleTransformEnd = (e: Konva.KonvaEventObject<Event>, id: string) => {
    const node = e.target;
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();

    // Reset scale to 1 and update width/height
    node.scaleX(1);
    node.scaleY(1);

    // Get original dimensions in meters
    const originalEl = elementi.find(e => e.id === id);
    const originalWidth = originalEl?.width || 0;
    const originalHeight = originalEl?.height || 0;
    
    // Calculate new dimensions in meters
    let newWidth = originalWidth * scaleX;
    let newHeight = originalHeight * scaleY;
    
    // Snap to grid (0.25m)
    // GRID_SIZE is 20px. pixelsPerMeter is e.g. 80px. SNAP = 0.25m.
    const SNAP = GRID_SIZE / pixelsPerMeter;
    
    newWidth = Math.max(SNAP, Math.round(newWidth / SNAP) * SNAP);
    newHeight = Math.max(SNAP, Math.round(newHeight / SNAP) * SNAP);

    // Update coordinates (in meters)
    const newX = node.x() / pixelsPerMeter;
    const newY = node.y() / pixelsPerMeter;
    
    setElementi(prev => prev.map(el => {
      if (el.id === id) {
        return {
          ...el,
          x: newX,
          y: newY,
          width: newWidth,
          height: newHeight,
          rotation: node.rotation()
        };
      }
      return el;
    }));
  };

  return (
    <div className="flex h-screen flex-col bg-gray-50">
      <Navbar 
        title="Disegna Ristorante"
        icon={<PenTool className="w-6 h-6 sm:w-8 sm:h-8" />}
        leftActions={
           <div className="flex items-center gap-2">
             <button 
               onClick={() => setShowSidebar(!showSidebar)}
               className="p-1 text-gray-600 hover:bg-gray-100 rounded md:hidden"
               title="Menu Strumenti"
             >
               <Menu className="w-6 h-6" />
             </button>
             <Link to="/impostazioni" className="text-gray-500 hover:text-[--secondary] p-1">
                <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
             </Link>
           </div>
        }
        pageActions={
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
            
            <Bottone onClick={salvaLayout} className="flex items-center gap-2 shadow-md">
              <Save className="w-4 h-4" />
              <span className="hidden sm:inline">Salva</span>
            </Bottone>
          </div>
        }
      />

      {/* Mobile Sidebar Overlay */}
      {showSidebar && (
        <div className="fixed inset-0 z-50 flex md:hidden mt-16 sm:mt-20">
          <div 
            className="absolute inset-0 bg-black/50" 
            onClick={() => setShowSidebar(false)}
          />
          <Sidebar
            className="w-[80%] h-full shadow-xl relative z-10"
            roomDimensions={roomDimensions}
            setRoomDimensions={setRoomDimensions}
            creaStanza={() => {
              creaStanza();
              setShowSidebar(false);
            }}
            onAddObject={(name, w, h) => {
              aggiungiElemento('rect', { width: w, height: h, label: name });
              setShowSidebar(false);
            }}
            onAddDoor={() => {
                aggiungiElemento('door');
                setShowSidebar(false);
            }}
          />
        </div>
      )}

      <div className="flex flex-1 overflow-hidden mt-16 sm:mt-20">
          {/* Sidebar */}
          <Sidebar
            className="w-64 min-w-[250px] flex-shrink-0 hidden md:flex"
            roomDimensions={roomDimensions}
            setRoomDimensions={setRoomDimensions}
            creaStanza={creaStanza}
            onAddObject={(name, w, h) => aggiungiElemento('rect', { width: w, height: h, label: name })}
            onAddDoor={() => aggiungiElemento('door')}
          />

          {/* Canvas Area */}
          <div className="flex-1 overflow-hidden bg-gray-100 relative" ref={containerRef}>
            <div 
              className="bg-white shadow-xl mx-auto relative border-l border-gray-200"
              style={{ width: '100%', height: '100%', minHeight: '500px' }}
            >
            <Stage 
              width={stageSize.width} 
              height={stageSize.height}
              style={{ opacity: isLayoutReady ? 1 : 0, transition: 'opacity 0.3s ease-in' }}
              onMouseDown={(e) => {
                // Deselect if clicked on stage (but not on an element)
                // e.target refers to the shape that was clicked
                // If it's the Stage or the background Rect, deselect
                if (e.target === e.target.getStage()) {
                  setSelectedId(null);
                }
              }}
            >
              <Layer>
                <Rect 
                  width={stageSize.width} 
                  height={stageSize.height} 
                  fill="#ffffff" 
                  listening={true}
                  onMouseDown={() => setSelectedId(null)}
                />
                
                <Group x={contentOffset.x} y={contentOffset.y} scaleX={scale} scaleY={scale}>
                    <Griglia 
                        stageSize={stageSize} 
                        visibleRect={{
                            x: -contentOffset.x / scale,
                            y: -contentOffset.y / scale,
                            width: stageSize.width / scale,
                            height: stageSize.height / scale
                        }}
                        gridSize={pixelsPerMeter * 0.25}
                    />

                    {elementi.map((el) => (
                    <ElementoCanvas
                        key={el.id}
                        elemento={{
                            ...el,
                            x: el.x * pixelsPerMeter,
                            y: el.y * pixelsPerMeter,
                            width: el.width ? el.width * pixelsPerMeter : undefined,
                            height: el.height ? el.height * pixelsPerMeter : undefined,
                            fontSize: el.fontSize ? el.fontSize * pixelsPerMeter : undefined
                        }}
                        isSelected={selectedId === el.id}
                        onSelect={() => setSelectedId(el.id)}
                        onDragEnd={handleDragEnd}
                        onTransformEnd={handleTransformEnd}
                    />
                    ))}

                    <Transformer
                    ref={transformerRef}
                    boundBoxFunc={(oldBox, newBox) => {
                        if (newBox.width < 20 || newBox.height < 20) {
                        return oldBox;
                        }
                        return newBox;
                    }}
                    />
                    
                    <SelectedNodeTransformer selectedId={selectedId} />
                </Group>
              </Layer>
            </Stage>
            </div>
          </div>
          
          {/* Mobile Drawer / Bottom Sheet equivalent could go here if needed, 
              but for now standard controls are in Strumenti or we can make Sidebar collapsible */}
      </div>
    </div>
  );
}

// Helper component to attach transformer
const SelectedNodeTransformer = ({ selectedId }: { selectedId: string | null }) => {
  const trRef = useRef<Konva.Transformer>(null);
  const stage = trRef.current?.getStage();

  useEffect(() => {
    if (selectedId && trRef.current && stage) {
      const selectedNode = stage.findOne('#' + selectedId);
      if (selectedNode) {
        trRef.current.nodes([selectedNode]);
        trRef.current.getLayer()?.batchDraw();
      }
    } else if (trRef.current) {
      trRef.current.nodes([]);
      trRef.current.getLayer()?.batchDraw();
    }
  }, [selectedId, stage]);

  return <Transformer ref={trRef} />;
};
