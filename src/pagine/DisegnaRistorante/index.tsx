import { useState, useRef, useEffect } from 'react';
import { Stage, Layer, Rect, Transformer, Group } from 'react-konva';
import Konva from 'konva';
import { Elemento, GRID_SIZE } from './types';
import Strumenti from './Strumenti';
import Sidebar from './Sidebar';
import Griglia from './Griglia';
import ElementoCanvas from './ElementoCanvas';

export default function DisegnaRistorante() {
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
    
                const contentHeight = maxY - minY;
                const contentBottom = maxY + 20;
                
                const PADDING = 20;
                const contentRight = maxX + PADDING;
                
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
                const alignedX = PADDING_LEFT - minX * newScale;
                const centeredY = (height - contentHeight * newScale) / 2 - minY * newScale;
                
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

  // Load layout from local storage on mount
  useEffect(() => {
    const savedLayout = localStorage.getItem('layout.locale');
    if (savedLayout) {
      try {
        const parsed = JSON.parse(savedLayout);
        if (parsed.elementi && parsed.roomDimensions) {
          setElementi(parsed.elementi);
          setRoomDimensions(parsed.roomDimensions);
          // Also restore scale if saved, or recalculate? 
          // Recalculating scale based on room dimensions is safer to adapt to current screen
        }
      } catch (e) {
        console.error("Failed to load layout", e);
      }
    }
  }, []);

  const salvaLayout = () => {
    const layoutData = {
      elementi,
      roomDimensions,
      timestamp: Date.now()
    };
    localStorage.setItem('layout.locale', JSON.stringify(layoutData));
    alert('Layout salvato in locale!');
  };

  const aggiungiElemento = (type: 'rect' | 'wall' | 'door', customProps?: { width?: number, height?: number, label?: string }) => {
    const isWall = type === 'wall';
    // Snap initial position to grid
    const startX = Math.round(100 / GRID_SIZE) * GRID_SIZE;
    const startY = Math.round(100 / GRID_SIZE) * GRID_SIZE;
    
    // Default sizes if no custom props
    let width, height;
    
    if (customProps?.width && customProps?.height) {
        width = customProps.width * pixelsPerMeter;
        height = customProps.height * pixelsPerMeter;
    } else {
        // Table: 1x1 meter
        // Wall: length 1 meter, thickness 1 cell
        // Door: 1 meter x thickness (will be rotated later if needed)
        if (type === 'door') {
           width = pixelsPerMeter; // 1 meter wide
           height = GRID_SIZE;     // Wall thickness
        } else {
           width = isWall ? pixelsPerMeter : pixelsPerMeter;
           height = isWall ? GRID_SIZE : pixelsPerMeter;
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
      rotation: 0
    };
    setElementi([...elementi, newElement]);
  };

  const creaStanza = () => {
    // 1. Get container dimensions
    const containerWidth = containerRef.current?.offsetWidth || window.innerWidth;
    const containerHeight = containerRef.current?.offsetHeight || window.innerHeight;

    // 2. Define margins (3 cells padding on all sides)
    const margin = 3 * GRID_SIZE;
    const availableWidth = containerWidth - (margin * 2);
    const availableHeight = containerHeight - (margin * 2);

    // 3. Calculate required pixels per meter to fit width and height
    const pixelsPerMeterX = availableWidth / roomDimensions.width;
    const pixelsPerMeterY = availableHeight / roomDimensions.height;

    // 4. Choose the smaller scale to ensure it fits both dimensions
    // Default max scale: 4 cells per meter (80px/m) -> Standard view
    // Min scale: 0.5px/m -> To fit huge rooms
    let newPixelsPerMeter = Math.min(pixelsPerMeterX, pixelsPerMeterY);
    
    // Clamp to a reasonable maximum (standard view) so small rooms don't explode
    newPixelsPerMeter = Math.min(newPixelsPerMeter, 4 * GRID_SIZE);

    // Update state for future elements
    setCellsPerMeter(newPixelsPerMeter / GRID_SIZE);

    // 5. Create Room Elements
    const innerW = roomDimensions.width * newPixelsPerMeter;
    const innerH = roomDimensions.height * newPixelsPerMeter;
    const wallThickness = GRID_SIZE; // Keep walls visually consistent
    
    // Start position: 3 cells from top/left
    const startX = margin; 
    const startY = margin;

    // Room is a single object (Rect with stroke)
    // To match inner dimensions, we need to adjust for the stroke which is centered
    // The Rect x,y should be offset by half thickness
    const roomElement: Elemento = {
        id: `room-${Date.now()}`,
        x: startX - wallThickness/2,
        y: startY - wallThickness/2,
        type: 'room',
        width: innerW + wallThickness,
        height: innerH + wallThickness,
        rotation: 0
    };

    const labels: Elemento[] = [
      // Width Label (Top)
      {
        id: `label-width-${Date.now()}`,
        x: startX,
        y: startY - (wallThickness * 2),
        type: 'text',
        label: `${roomDimensions.width}m`,
        width: innerW,
        height: GRID_SIZE,
        rotation: 0,
        fontSize: 16
      },
      // Height Label (Left)
      {
        id: `label-height-${Date.now()}`,
        x: startX - (wallThickness * 2),
        y: startY + innerH,
        type: 'text',
        label: `${roomDimensions.height}m`,
        width: innerH,
        height: GRID_SIZE,
        rotation: -90,
        fontSize: 16
      }
    ];

    // Replace existing elements to start fresh with the new scale
    setElementi([roomElement, ...labels]);
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
    // Check if dragging a door
    const draggedEl = elementi.find(el => el.id === id);
    if (draggedEl?.type === 'door') {
        // Find the room element
        const room = elementi.find(el => el.type === 'room');
        if (room) {
            const rx = room.x;
            const ry = room.y;
            const rw = room.width || 0;
            const rh = room.height || 0;
            
            // Wall centers
            const walls = [
                { name: 'top', y: ry, x1: rx, x2: rx + rw, vertical: false },
                { name: 'bottom', y: ry + rh, x1: rx, x2: rx + rw, vertical: false },
                { name: 'left', x: rx, y1: ry, y2: ry + rh, vertical: true },
                { name: 'right', x: rx + rw, y1: ry, y2: ry + rh, vertical: true }
            ];

            const ex = e.target.x();
            const ey = e.target.y();
            
            // Find closest wall
            let minDist = Infinity;
            let closestWall = null;
            let snapX = ex;
            let snapY = ey;
            let snapRotation = 0;

            walls.forEach(wall => {
                let dist, px, py;
                if (wall.vertical) {
                    // Vertical Wall
                    // Door width (1m) is along the Y axis.
                    // Visual range: [y, y + doorWidth]
                    // Valid range: [y1, y2]
                    // So y must be in [y1, y2 - doorWidth]
                    
                    const doorLength = draggedEl.width || 0;
                    const validY1 = wall.y1!;
                    const validY2 = wall.y2! - doorLength;
                    
                    // Projection to find closest wall
                    py = Math.max(wall.y1!, Math.min(ey, wall.y2!));
                    px = wall.x!;
                    dist = Math.sqrt(Math.pow(ex - px, 2) + Math.pow(ey - py, 2));
                    
                    if (dist < minDist) {
                        minDist = dist;
                        closestWall = wall;
                        snapX = px; 
                        // Clamp TOP-LEFT corner Y position
                        // We use ey (mouse/drag position) as the reference for the top-left
                        // But wait, if user grabs in middle, ey is top-left?
                        // Yes, Konva drags by top-left anchor by default.
                        snapY = Math.max(validY1, Math.min(ey, validY2));
                        snapRotation = 90;
                    }
                } else {
                    // Horizontal Wall
                    // Door width (1m) is along the X axis.
                    // Visual range: [x, x + doorWidth]
                    // Valid range: [x1, x2]
                    // So x must be in [x1, x2 - doorWidth]

                    const doorLength = draggedEl.width || 0;
                    const validX1 = wall.x1!;
                    const validX2 = wall.x2! - doorLength;

                    px = Math.max(wall.x1!, Math.min(ex, wall.x2!));
                    py = wall.y!;
                    dist = Math.sqrt(Math.pow(ex - px, 2) + Math.pow(ey - py, 2));

                    if (dist < minDist) {
                        minDist = dist;
                        closestWall = wall;
                        // Clamp TOP-LEFT corner X position
                        snapX = Math.max(validX1, Math.min(ex, validX2));
                        snapY = py; 
                        snapRotation = 0;
                    }
                }
            });

            // Apply snap
            if (closestWall) {
                // Apply offsets to align the element thickness with the wall thickness
                
                if (snapRotation === 90) {
                     // Vertical Door (90 deg)
                     // Visual shape: Rectangle rotated 90 deg around (x,y)
                     // If (x,y) is top-left of unrotated rect:
                     // Rotated 90 deg clockwise:
                     // Visual X range: [x - H, x]
                     // Visual Y range: [y, y + W]
                     // Wall Center X is at snapX.
                     // Wall Center Y is variable along the wall.
                     
                     // We want Visual Center X to be at Wall Center X (snapX).
                     // Visual Center X = x - H/2.
                     // So x - H/2 = snapX => x = snapX + H/2.
                     
                     // We want Visual Start Y to be at snapY (clamped position).
                     // Visual Start Y = y.
                     // So y = snapY.
                     
                     snapX += GRID_SIZE/2;
                     // snapY is already correct (top edge of the door along the wall)
                } else {
                     // Horizontal Door (0 deg)
                     // Visual shape: Rectangle unrotated
                     // Visual X range: [x, x + W]
                     // Visual Y range: [y, y + H]
                     // Wall Center Y is at snapY.
                     
                     // We want Visual Center Y to be at Wall Center Y (snapY).
                     // Visual Center Y = y + H/2.
                     // So y + H/2 = snapY => y = snapY - H/2.
                     
                     // We want Visual Start X to be at snapX (clamped position).
                     // Visual Start X = x.
                     // So x = snapX.
                     
                     snapY -= GRID_SIZE/2;
                     // snapX is already correct (left edge of the door along the wall)
                }
            }
            
            // Update state
            e.target.x(snapX);
            e.target.y(snapY);
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

    // Standard Snap to grid logic for other elements
    const x = Math.round(e.target.x() / GRID_SIZE) * GRID_SIZE;
    const y = Math.round(e.target.y() / GRID_SIZE) * GRID_SIZE;

    e.target.x(x);
    e.target.y(y);
    
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

    // Snap new width/height to nearest grid fraction (e.g. half grid for walls)
    const rawWidth = Math.max(GRID_SIZE / 2, (elementi.find(e => e.id === id)?.width || 0) * scaleX);
    const rawHeight = Math.max(GRID_SIZE / 2, (elementi.find(e => e.id === id)?.height || 0) * scaleY);
    
    setElementi(prev => prev.map(el => {
      if (el.id === id) {
        return {
          ...el,
          x: node.x(),
          y: node.y(),
          width: rawWidth,
          height: rawHeight,
          rotation: node.rotation()
        };
      }
      return el;
    }));
  };

  return (
    <div className="flex h-screen flex-col bg-gray-50">
      <Strumenti
        selectedId={selectedId}
        ruotaSelezionato={ruotaSelezionato}
        rimuoviSelezionato={rimuoviSelezionato}
        onSave={salvaLayout}
        onToggleSidebar={() => setShowSidebar(!showSidebar)}
      />

      {/* Mobile Sidebar Overlay */}
      {showSidebar && (
        <div className="fixed inset-0 z-50 flex md:hidden">
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

      <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <Sidebar
            className="w-[25%] min-w-[250px] flex-shrink-0 hidden md:flex"
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
                    />

                    {elementi.map((el) => (
                    <ElementoCanvas
                        key={el.id}
                        elemento={el}
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
