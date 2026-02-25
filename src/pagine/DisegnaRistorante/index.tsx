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
import MobileStickyBar from '../../componenti/MobileStickyBar';
import { Menu, RotateCw, Trash2, Save, PenTool, Plus, Minus, ChefHat } from 'lucide-react';
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
  const [hasInitialLayout, setHasInitialLayout] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [isSaving, setIsSaving] = useState(false);
  
  // 4 cells per meter = 80px per meter (if GRID_SIZE is 20)
  // This gives 25cm precision (1 cell = 25cm)
  const [cellsPerMeter] = useState(4);
  
  const pixelsPerMeter = cellsPerMeter * GRID_SIZE;

  const containerRef = useRef<HTMLDivElement>(null);
  const lastCenter = useRef<{ x: number, y: number } | null>(null);
  const lastDist = useRef<number>(0);

  const getDistance = (p1: { x: number, y: number }, p2: { x: number, y: number }) => {
    return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
  };

  const getCenter = (p1: { x: number, y: number }, p2: { x: number, y: number }) => {
    return {
      x: (p1.x + p2.x) / 2,
      y: (p1.y + p2.y) / 2,
    };
  };

  const handleTouchMove = (e: Konva.KonvaEventObject<TouchEvent>) => {
    e.evt.preventDefault();
    const touch1 = e.evt.touches[0];
    const touch2 = e.evt.touches[1];

    if (touch1 && touch2) {
      const p1 = { x: touch1.clientX, y: touch1.clientY };
      const p2 = { x: touch2.clientX, y: touch2.clientY };

      if (!lastCenter.current) {
        lastCenter.current = getCenter(p1, p2);
        lastDist.current = getDistance(p1, p2);
        return;
      }

      const newDist = getDistance(p1, p2);
      const newCenter = getCenter(p1, p2);

      const pointTo = {
        x: (newCenter.x - contentOffset.x) / scale,
        y: (newCenter.y - contentOffset.y) / scale,
      };

      const scaleBy = newDist / lastDist.current;
      const newScale = Math.max(0.2, Math.min(2.0, scale * scaleBy));

      const newOffset = {
        x: newCenter.x - pointTo.x * newScale,
        y: newCenter.y - pointTo.y * newScale,
      };

      setScale(newScale);
      setContentOffset(newOffset);
      lastDist.current = newDist;
      lastCenter.current = newCenter;
    }
  };

  const handleTouchEnd = () => {
    lastCenter.current = null;
    lastDist.current = 0;
  };

  // Aggiorna dimensioni stage e scala solo se necessario per far entrare il contenuto (Mobile fix)
  useEffect(() => {
    let animationFrameId: number;

    const handleResize = () => {
      if (containerRef.current) {
        const width = containerRef.current.offsetWidth;
        const height = containerRef.current.offsetHeight;
        
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
        
        animationFrameId = requestAnimationFrame(() => {
            setStageSize({ width, height });
            
            // Auto-fit only on initial load or when window is resized IF we don't have a layout yet
            if (elementi.length > 0 && !hasInitialLayout) {
                let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
                
                elementi.forEach(el => {
                    minX = Math.min(minX, el.x);
                    minY = Math.min(minY, el.y);
                    maxX = Math.max(maxX, el.x + (el.width || 0));
                    maxY = Math.max(maxY, el.y + (el.height || 0));
                });
                
                // Content dimensions in pixels (logical, pre-scale)
                // Add 1 meter padding (pixelsPerMeter) to each side for better visibility
                const paddingMeters = 1.0;
                const minX_px = (minX - paddingMeters) * pixelsPerMeter;
                const minY_px = (minY - paddingMeters) * pixelsPerMeter;
                const maxX_px = (maxX + paddingMeters) * pixelsPerMeter;
                const maxY_px = (maxY + paddingMeters) * pixelsPerMeter;
    
                const contentWidth = maxX_px - minX_px;
                const contentHeight = maxY_px - minY_px;
                
                // Scale factor to fit content within stage with margins
                const scaleX = width / contentWidth;
                const scaleY = height / contentHeight;
                
                let newScale = Math.min(scaleX, scaleY);
                
                // Limit maximum scale to 1.5 to avoid over-zooming small rooms
                if (newScale > 1.5) newScale = 1.5;
                if (newScale < 0.2) newScale = 0.2;
    
                setScale(newScale);
    
                // Center content
                const centeredX = (width - contentWidth * newScale) / 2 - minX_px * newScale;
                const centeredY = (height - contentHeight * newScale) / 2 - minY_px * newScale;
                
                setContentOffset({ 
                    x: centeredX, 
                    y: centeredY 
                });
                
                setIsLayoutReady(true);
                setHasInitialLayout(true);
            } else if (elementi.length === 0) {
                setScale(1);
                setContentOffset({ x: 0, y: 0 });
                setIsLayoutReady(true);
            } else {
                // Keep current scale and offset, just update stage ready state
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

    setIsSaving(true);
    setSaveStatus('idle');

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
            setSaveStatus('error');
        } else {
            setSaveStatus('success');
        }
    } catch (e) {
        console.error('Exception saving layout:', e);
        setSaveStatus('error');
    } finally {
        setIsSaving(false);
    }
  };

  const aggiungiElemento = (type: 'rect' | 'wall' | 'door' | 'bancone', customProps?: { width?: number, height?: number, label?: string }) => {
    const isWall = type === 'wall';
    
    // Position it in the center of the current view
    const viewCenterX = (-contentOffset.x + stageSize.width / 2) / (scale * pixelsPerMeter);
    const viewCenterY = (-contentOffset.y + stageSize.height / 2) / (scale * pixelsPerMeter);
    
    // Snap to grid
    const SNAP = GRID_SIZE / pixelsPerMeter;
    const startX = Math.round(viewCenterX / SNAP) * SNAP;
    const startY = Math.round(viewCenterY / SNAP) * SNAP;
    
    // Default sizes in meters
    let width, height;
    
    if (customProps?.width && customProps?.height) {
        width = customProps.width; // Already in meters
        height = customProps.height;
    } else {
        // Table: 1x1 meter
        // Wall: length 1 meter, thickness 0.25m (1 cell)
        // Door: 1 meter x thickness (0.25m)
        const WALL_THICKNESS = 0.25;
        if (type === 'door') {
           width = 1.0; // 1 meter wide
           height = WALL_THICKNESS; 
        } else if (type === 'bancone') {
           width = 2.0;
           height = 1.0;
        } else {
           width = 1.0;
           height = isWall ? WALL_THICKNESS : 1.0;
        }
    }

    let label = customProps?.label;
    if (!label) {
       if (type === 'rect') {
         const tableNumbers = elementi
           .filter(e => e.type === 'rect' && e.label?.startsWith('Tavolo '))
           .map(e => parseInt(e.label!.split(' ')[1]) || 0);
         const nextNum = tableNumbers.length > 0 ? Math.max(...tableNumbers) + 1 : 1;
         label = `Tavolo ${nextNum}`;
       } else if (type === 'bancone') {
        label = 'Bancone';
      } else if (type === 'door') {
        label = 'Porta';
      }
    }

    const newElement: Elemento = {
      id: `el-${Date.now()}`,
      x: startX,
      y: startY,
      type,
      width,
      height,
      label,
      rotation: 0,
      normalized: true
    };

    setElementi([...elementi, newElement]);
    setSelectedId(newElement.id);
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

    // Keep fixed metric: 1 cell = 1 meter

    // 5. Create Room Elements (in METERS)
    const WALL_THICKNESS = 0.25; // 25cm
    
    // Start position: 1 meter from top/left (arbitrary logical position)
    const startX = 1.0; 
    const startY = 1.0;

    // Room is a single object (Rect with stroke)
    const roomElement: Elemento = {
        id: `room-${Date.now()}`,
        x: startX,
        y: startY,
        type: 'room',
        width: roomDimensions.width,
        height: roomDimensions.height,
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
          const oldRotation = el.rotation || 0;
          const newRotation = (oldRotation + 90) % 360;
          
          const w = el.width || 0;
          const h = el.height || 0;
          
          // Centro attuale
          const centerX = el.x + w / 2;
          const centerY = el.y + h / 2;
          
          // Dimensioni visuali dopo la rotazione
          const isVertical = newRotation % 180 !== 0;
          const visW = isVertical ? h : w;
          const visH = isVertical ? w : h;
          
          // Snap del nuovo angolo in alto a sinistra visuale
          const SNAP = GRID_SIZE / pixelsPerMeter;
          let visX = centerX - visW / 2;
          let visY = centerY - visH / 2;
          
          visX = Math.round(visX / SNAP) * SNAP;
          visY = Math.round(visY / SNAP) * SNAP;
          
          // Nuovo centro dopo lo snap
          const newCenterX = visX + visW / 2;
          const newCenterY = visY + visH / 2;
          
          // Nuova posizione logica x,y (top-left originale)
          const nextX = newCenterX - w / 2;
          const nextY = newCenterY - h / 2;

          return { 
            ...el, 
            x: nextX, 
            y: nextY, 
            rotation: newRotation 
          };
        }
        return el;
      }));
    }
  };

  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>, id: string) => {
    // Snap to grid (0.25m = 1 cell)
    const SNAP = GRID_SIZE / pixelsPerMeter;

    const el = elementi.find(item => item.id === id);
    if (!el) return;

    const w = el.width || 0;
    const h = el.height || 0;
    const rotation = el.rotation || 0;

    // e.target is the group. x() and y() are the center because of offset
    const currentCenterX = e.target.x() / pixelsPerMeter;
    const currentCenterY = e.target.y() / pixelsPerMeter;

    // Visual dimensions based on rotation
    const isVertical = rotation % 180 !== 0;
    const visW = isVertical ? h : w;
    const visH = isVertical ? w : h;

    // Snap the visual top-left corner
    const visTopLeftX = currentCenterX - visW / 2;
    const visTopLeftY = currentCenterY - visH / 2;
    
    const snappedVisX = Math.round(visTopLeftX / SNAP) * SNAP;
    const snappedVisY = Math.round(visTopLeftY / SNAP) * SNAP;

    // New center after snapping
    const newCenterX = snappedVisX + visW / 2;
    const newCenterY = snappedVisY + visH / 2;

    // Logical top-left (original coordinates)
    const snappedX = newCenterX - w / 2;
    const snappedY = newCenterY - h / 2;

    // Update Konva node position (center)
    e.target.x((snappedX + w / 2) * pixelsPerMeter);
    e.target.y((snappedY + h / 2) * pixelsPerMeter);
    
    setElementi(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, x: snappedX, y: snappedY };
      }
      return item;
    }));
  };

  const zoomTo = (newScale: number) => {
    if (newScale > 2) newScale = 2;
    if (newScale < 0.1) newScale = 0.1;
    setScale(newScale);
    if (elementi.length > 0 && containerRef.current) {
      const width = containerRef.current.offsetWidth;
      const height = containerRef.current.offsetHeight;
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      elementi.forEach(el => {
        minX = Math.min(minX, el.x);
        minY = Math.min(minY, el.y);
        maxX = Math.max(maxX, el.x + (el.width || 0));
        maxY = Math.max(maxY, el.y + (el.height || 0));
      });
      const minX_px = minX * pixelsPerMeter;
      const minY_px = minY * pixelsPerMeter;
      const maxX_px = maxX * pixelsPerMeter;
      const maxY_px = maxY * pixelsPerMeter;
      const contentWidth = maxX_px - minX_px;
      const contentHeight = maxY_px - minY_px;
      const centeredX = (width - contentWidth * newScale) / 2 - minX_px * newScale;
      const centeredY = (height - contentHeight * newScale) / 2 - minY_px * newScale;
      setContentOffset({ x: centeredX, y: centeredY });
    }
  };

  const zoomIn = () => zoomTo(scale + 0.1);
  const zoomOut = () => zoomTo(scale - 0.1);

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
    const SNAP = GRID_SIZE / pixelsPerMeter;
    
    newWidth = Math.max(SNAP, Math.round(newWidth / SNAP) * SNAP);
    newHeight = Math.max(SNAP, Math.round(newHeight / SNAP) * SNAP);

    // node.x() and node.y() are the center because of offset
    const centerX = node.x() / pixelsPerMeter;
    const centerY = node.y() / pixelsPerMeter;
    
    // Visual dimensions based on rotation
    const rotation = node.rotation();
    const isVertical = rotation % 180 !== 0;
    const visW = isVertical ? newHeight : newWidth;
    const visH = isVertical ? newWidth : newHeight;

    // Snap the visual top-left corner
    const visTopLeftX = centerX - visW / 2;
    const visTopLeftY = centerY - visH / 2;
    
    const snappedVisX = Math.round(visTopLeftX / SNAP) * SNAP;
    const snappedVisY = Math.round(visTopLeftY / SNAP) * SNAP;

    // New center after snapping
    const newCenterX = snappedVisX + visW / 2;
    const newCenterY = snappedVisY + visH / 2;

    // Logical top-left (original coordinates)
    const newX = newCenterX - newWidth / 2;
    const newY = newCenterY - newHeight / 2;
    
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
            onAddTable={(w, h) => {
              aggiungiElemento('rect', { width: w, height: h });
              setShowSidebar(false);
            }}
            onAddBancone={(w, h) => {
              aggiungiElemento('bancone', { width: w, height: h });
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
            onAddTable={(w, h) => aggiungiElemento('rect', { width: w, height: h })}
            onAddBancone={(w, h) => aggiungiElemento('bancone', { width: w, height: h })}
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
              style={{ 
                opacity: isLayoutReady ? 1 : 0, 
                transition: 'opacity 0.3s ease-in',
                cursor: selectedId ? 'default' : 'grab'
              }}
              onMouseDown={(e) => {
                const clickedOnEmpty = e.target === e.target.getStage();
                if (clickedOnEmpty) {
                  setSelectedId(null);
                }
              }}
              onTouchStart={(e) => {
                 const clickedOnEmpty = e.target === e.target.getStage();
                 if (clickedOnEmpty) {
                   setSelectedId(null);
                 }
               }}
               onTouchMove={handleTouchMove}
               onTouchEnd={handleTouchEnd}
            >
              <Layer>
                <Group 
                  x={contentOffset.x} 
                  y={contentOffset.y} 
                  scaleX={scale} 
                  scaleY={scale}
                  draggable={true}
                  onDragEnd={(e) => {
                    if (e.target === e.currentTarget) {
                      setContentOffset({ x: e.target.x(), y: e.target.y() });
                    }
                  }}
                >
                  {/* Background area inside Group to capture panning anywhere */}
                  <Rect 
                     width={stageSize.width * 20 / scale} 
                     height={stageSize.height * 20 / scale}
                     x={-stageSize.width * 10 / scale}
                     y={-stageSize.height * 10 / scale}
                     fill="white"
                     opacity={0}
                     listening={true}
                   />
                  
                  <Griglia 
                      stageSize={stageSize} 
                      visibleRect={{
                          x: -contentOffset.x / scale,
                          y: -contentOffset.y / scale,
                          width: stageSize.width / scale,
                          height: stageSize.height / scale
                      }}
                      gridSize={pixelsPerMeter}
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

                    <SelectedNodeTransformer selectedId={selectedId} />
                </Group>
              </Layer>
            </Stage>
            </div>
          </div>
          
          {/* FAB icons (desktop + mobile) */}
          <div className="fixed bottom-24 right-6 z-40 flex flex-row gap-3 md:bottom-6">
            <button 
              onClick={zoomOut}
              className="w-12 h-12 rounded-full shadow-lg bg-white border border-gray-200 flex items-center justify-center text-gray-700"
              title="Zoom -"
            >
              <Minus className="w-6 h-6" />
            </button>
            <button 
              onClick={zoomIn}
              className="w-12 h-12 rounded-full shadow-lg bg-white border border-gray-200 flex items-center justify-center text-gray-700"
              title="Zoom +"
            >
              <Plus className="w-6 h-6" />
            </button>
            <button 
              onClick={ruotaSelezionato}
              disabled={!selectedId}
              className="w-12 h-12 rounded-full shadow-lg bg-white border border-gray-200 flex items-center justify-center text-gray-700 disabled:opacity-50"
              title="Ruota"
            >
              <RotateCw className="w-6 h-6" />
            </button>
            <button 
              onClick={rimuoviSelezionato}
              disabled={!selectedId}
              className="w-12 h-12 rounded-full shadow-lg bg-white border border-gray-200 flex items-center justify-center text-red-600 disabled:opacity-50"
              title="Elimina"
            >
              <Trash2 className="w-6 h-6" />
            </button>
            <button 
              onClick={salvaLayout}
              disabled={isSaving}
              className="w-12 h-12 rounded-full shadow-lg bg-[--primary] text-white flex items-center justify-center disabled:opacity-50"
              title="Salva"
            >
              {isSaving ? <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save className="w-6 h-6" />}
            </button>
          </div>
      </div>

      {/* Modale Feedback Salvataggio */}
      {saveStatus !== 'idle' && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 text-center">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                saveStatus === 'success' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
              }`}>
                {saveStatus === 'success' ? (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </div>
              
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {saveStatus === 'success' ? 'Salvato con successo!' : 'Errore nel salvataggio'}
              </h3>
              <p className="text-gray-500 mb-8">
                {saveStatus === 'success' 
                  ? 'La tua piantina è stata aggiornata correttamente.' 
                  : 'Si è verificato un problema. Prova a ricaricare la pagina.'}
              </p>

              <div className="flex flex-col gap-3">
                {saveStatus === 'error' ? (
                  <Bottone 
                    variante="primario" 
                    className="w-full justify-center py-3"
                    onClick={() => window.location.reload()}
                  >
                    Ricarica e riprova
                  </Bottone>
                ) : (
                  <Bottone 
                    variante="primario" 
                    className="w-full justify-center py-3"
                    onClick={() => setSaveStatus('idle')}
                  >
                    Ottimo!
                  </Bottone>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <MobileStickyBar
        activeKey="disegna"
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

  return (
    <Transformer
      ref={trRef}
      rotateEnabled={false}
      resizeEnabled={false}
      enabledAnchors={[]}
      borderStroke="transparent"
      anchorStroke="transparent"
      anchorFill="transparent"
    />
  );
};
