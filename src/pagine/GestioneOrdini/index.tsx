import { useState, useEffect, useRef } from 'react';
import { Stage, Layer, Rect, Group } from 'react-konva';
import { Link } from 'react-router-dom';
import { ArrowLeft, ChefHat, Plus, Trash2, ShoppingCart } from 'lucide-react';
import ElementoCanvas from '../DisegnaRistorante/ElementoCanvas';
import { Elemento } from '../DisegnaRistorante/types';
import { MenuItem, MenuCategory, CATEGORIES, Order, INITIAL_MENU } from '../GestioneMenu/types';
import Bottone from '../../componenti/Bottone';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../supabaseClient';

export default function GestioneOrdini() {
  const { user } = useAuth();
  const [elementi, setElementi] = useState<Elemento[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [stageSize, setStageSize] = useState({ width: 800, height: 600 });
  const [activeCategory, setActiveCategory] = useState<MenuCategory | null>(null);
  const [contentOffset, setContentOffset] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [isLayoutReady, setIsLayoutReady] = useState(false);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  
  const containerRef = useRef<HTMLDivElement>(null);

  // Load Data from Supabase
  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
        const { data: restaurant } = await supabase
            .from('restaurants')
            .select('*')
            .eq('user_id', user.id)
            .single();

        if (restaurant) {
            setRestaurantId(restaurant.id);
            
            // Layout
            if (restaurant.layout) {
                const parsed = restaurant.layout as any;
                if (parsed.elementi) setElementi(parsed.elementi);
            }

            // Menu
            const { data: menu } = await supabase
                .from('menu_items')
                .select('*')
                .eq('restaurant_id', restaurant.id);
            if (menu) setMenuItems(menu);

            // Active Orders
            const { data: activeOrders } = await supabase
                .from('orders')
                .select(`
                    *,
                    order_items (*)
                `)
                .eq('restaurant_id', restaurant.id)
                .in('status', ['active']); 
                
            if (activeOrders) {
                const mappedOrders: Order[] = activeOrders.map((o: any) => ({
                    id: o.id,
                    tableId: o.table_id,
                    status: o.status,
                    timestamp: new Date(o.created_at).getTime(),
                    items: (o.order_items || []).map((i: any) => ({
                        menuItemId: i.menu_item_id,
                        quantity: i.quantity,
                        name: i.name,
                        price: i.price
                    }))
                }));
                setOrders(mappedOrders);
            }
        }
    };
    
    loadData();
  }, [user]);

  // Save Orders - REMOVED (Handled via DB calls)
  /*
  useEffect(() => {
    if (orders.length > 0) {
      localStorage.setItem('orders.data', JSON.stringify(orders));
    }
  }, [orders]);
  */

  // Handle Resize and Centering
  useEffect(() => {
    let animationFrameId: number;

    const handleResize = () => {
      if (containerRef.current) {
        const width = containerRef.current.offsetWidth;
        const height = containerRef.current.offsetHeight;
        
        if (animationFrameId) cancelAnimationFrame(animationFrameId);

        animationFrameId = requestAnimationFrame(() => {
            setStageSize({ width, height });
    
            // Calculate content center
            if (elementi.length > 0) {
                let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
                elementi.forEach(el => {
                    minX = Math.min(minX, el.x);
                    minY = Math.min(minY, el.y);
                    maxX = Math.max(maxX, el.x + (el.width || 0));
                    maxY = Math.max(maxY, el.y + (el.height || 0));
                });
    
                const contentWidth = maxX - minX;
                const contentHeight = maxY - minY;
                
                // Calculate scale to fit
                const PADDING = 40;
                const availableWidth = width - PADDING;
                const availableHeight = height - PADDING;
                
                const scaleX = availableWidth / contentWidth;
                const scaleY = availableHeight / contentHeight;
                
                // Fit within available space
                let newScale = Math.min(scaleX, scaleY);
                
                // Limit max scale to 1.2 to avoid excessive zoom on small content
                // But allow scaling down as much as needed
                newScale = Math.min(newScale, 1.2);
                
                setScale(newScale);
    
                const contentCenterX = minX + contentWidth / 2;
                const contentCenterY = minY + contentHeight / 2;
    
                const stageCenterX = width / 2;
                const stageCenterY = height / 2;
    
                setContentOffset({
                    x: stageCenterX - contentCenterX * newScale,
                    y: stageCenterY - contentCenterY * newScale
                });
                
                setIsLayoutReady(true);
            } else {
                setIsLayoutReady(true);
            }
        });
      }
    };

    window.addEventListener('resize', handleResize);
    // Initial resize with a delay to ensure elements are loaded
    const timer = setTimeout(handleResize, 100); 
    
    return () => {
        window.removeEventListener('resize', handleResize);
        clearTimeout(timer);
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [elementi]); // Re-calculate when elements change (loaded)

  const getTableColor = (tableId: string) => {
    const tableOrder = orders.find(o => o.tableId === tableId && o.status === 'active');
    // Green (#dcfce7 / #22c55e) if free, Red (#fee2e2 / #ef4444) if occupied
    return tableOrder && tableOrder.items.length > 0 ? '#fee2e2' : '#dcfce7';
  };

  const getTableStroke = (tableId: string) => {
    const tableOrder = orders.find(o => o.tableId === tableId && o.status === 'active');
    return tableOrder && tableOrder.items.length > 0 ? '#ef4444' : '#22c55e';
  };

  const handleTableSelect = (id: string) => {
    const el = elementi.find(e => e.id === id);
    if (el && el.type === 'rect') {
      setSelectedTableId(id);
    }
  };

  const handleAddToOrder = async (item: MenuItem) => {
    if (!selectedTableId || !restaurantId) return;

    let orderId: string;
    let newOrderCreated = false;

    // 1. Check local state for active order
    const existingOrderIndex = orders.findIndex(o => o.tableId === selectedTableId && o.status === 'active');
    
    // Optimistic Update
    setOrders(prev => {
      let newOrders = [...prev];
      if (existingOrderIndex >= 0) {
        // Update existing
        const order = { ...newOrders[existingOrderIndex] };
        const itemIndex = order.items.findIndex(i => i.menuItemId === item.id);
        if (itemIndex >= 0) {
            order.items[itemIndex] = { ...order.items[itemIndex], quantity: order.items[itemIndex].quantity + 1 };
        } else {
            order.items.push({ menuItemId: item.id, name: item.name, price: item.price, quantity: 1 });
        }
        newOrders[existingOrderIndex] = order;
      } else {
        // Create new
        newOrders.push({
            tableId: selectedTableId,
            status: 'active',
            timestamp: Date.now(),
            items: [{ menuItemId: item.id, name: item.name, price: item.price, quantity: 1 }]
        });
      }
      return newOrders;
    });

    // 2. DB Interaction
    try {
        if (existingOrderIndex >= 0 && orders[existingOrderIndex].id) {
            orderId = orders[existingOrderIndex].id!;
        } else {
            // Create Order in DB
            const { data: newOrder, error } = await supabase
                .from('orders')
                .insert([{ 
                    restaurant_id: restaurantId, 
                    table_id: selectedTableId,
                    status: 'active'
                }])
                .select()
                .single();
                
            if (error) throw error;
            orderId = newOrder.id;
            newOrderCreated = true;
        }

        // 3. Add/Update Item in DB
        // Check if item exists in order
        const { data: existingItems } = await supabase
            .from('order_items')
            .select('*')
            .eq('order_id', orderId)
            .eq('menu_item_id', item.id);
            
        if (existingItems && existingItems.length > 0) {
            const existingItem = existingItems[0];
            await supabase
                .from('order_items')
                .update({ quantity: existingItem.quantity + 1 })
                .eq('id', existingItem.id);
        } else {
            await supabase
                .from('order_items')
                .insert([{
                    order_id: orderId,
                    menu_item_id: item.id,
                    name: item.name,
                    price: item.price,
                    quantity: 1
                }]);
        }

        // If we created a new order, update the local state with the ID
        if (newOrderCreated) {
            setOrders(prev => prev.map(o => o.tableId === selectedTableId && !o.id ? { ...o, id: orderId } : o));
        }

    } catch (e) {
        console.error("Error adding to order:", e);
        // Revert optimistic update? Or just alert.
        alert("Errore nell'aggiornamento dell'ordine");
    }
  };

  const handleRemoveFromOrder = async (menuItemId: string) => {
    if (!selectedTableId || !restaurantId) return;
    
    const orderIndex = orders.findIndex(o => o.tableId === selectedTableId && o.status === 'active');
    if (orderIndex === -1) return;

    const order = orders[orderIndex];
    if (!order.id) return; // Should have ID by now

    // Optimistic Update
    setOrders(prev => {
      const newOrders = [...prev];
      const currentOrder = { ...newOrders[orderIndex] };
      const itemIndex = currentOrder.items.findIndex(i => i.menuItemId === menuItemId);
      
      if (itemIndex >= 0) {
         if (currentOrder.items[itemIndex].quantity > 1) {
             currentOrder.items[itemIndex].quantity -= 1;
         } else {
             currentOrder.items.splice(itemIndex, 1);
         }
      }
      
      if (currentOrder.items.length === 0) {
          newOrders.splice(orderIndex, 1);
      } else {
          newOrders[orderIndex] = currentOrder;
      }
      return newOrders;
    });

    // DB Interaction
    try {
        const { data: existingItems } = await supabase
            .from('order_items')
            .select('*')
            .eq('order_id', order.id)
            .eq('menu_item_id', menuItemId)
            .single();
            
        if (existingItems) {
            if (existingItems.quantity > 1) {
                await supabase
                    .from('order_items')
                    .update({ quantity: existingItems.quantity - 1 })
                    .eq('id', existingItems.id);
            } else {
                await supabase
                    .from('order_items')
                    .delete()
                    .eq('id', existingItems.id);
                    
                // Check if order is empty now
                const { count } = await supabase
                    .from('order_items')
                    .select('*', { count: 'exact', head: true })
                    .eq('order_id', order.id);
                    
                if (count === 0) {
                    await supabase
                        .from('orders')
                        .delete()
                        .eq('id', order.id);
                }
            }
        }
    } catch (e) {
        console.error("Error removing from order:", e);
    }
  };

  const handleCloseOrder = async () => {
      if (!selectedTableId || !restaurantId) return;
      
      const order = orders.find(o => o.tableId === selectedTableId && o.status === 'active');
      if (!order || !order.id) return;

      if (confirm('Chiudere il conto e liberare il tavolo?')) {
          // Optimistic
          setOrders(prev => prev.filter(o => o.tableId !== selectedTableId || o.status !== 'active'));
          setSelectedTableId(null);

          // DB
          try {
              await supabase
                  .from('orders')
                  .update({ status: 'completed' })
                  .eq('id', order.id);
          } catch (e) {
              console.error("Error closing order:", e);
              alert("Errore nella chiusura dell'ordine");
          }
      }
  };

  const currentOrder = orders.find(o => o.tableId === selectedTableId && o.status === 'active');
  const currentTotal = currentOrder?.items.reduce((sum, item) => sum + (item.price * item.quantity), 0) || 0;
  const selectedTableLabel = elementi.find(e => e.id === selectedTableId)?.label || 'Tavolo';

  // Filter only table elements for the list
  const tables = elementi.filter(el => el.type === 'rect');

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 p-4 flex items-center gap-4 shadow-sm z-10 shrink-0">
        <Link to="/" className="text-gray-500 hover:text-[--secondary] p-1">
            <ArrowLeft className="w-6 h-6" />
        </Link>
        <h1 className="text-xl font-bold text-[--secondary] flex items-center gap-2">
            <ChefHat className="w-6 h-6 text-[--primary]" />
            Sala & Ordini
        </h1>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar: Tables List */}
        <div className="w-[20%] min-w-[220px] bg-white border-r border-gray-200 flex flex-col shadow-lg z-10 shrink-0">
            <div className="p-4 border-b border-gray-200 bg-gray-50">
                <h2 className="font-bold text-lg text-gray-800">Tavoli</h2>
                <p className="text-sm text-gray-500">Seleziona un tavolo</p>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
                <div className="flex flex-col gap-3">
                    {tables.map(table => {
                        const isOccupied = getTableStroke(table.id) === '#ef4444';
                        const isSelected = selectedTableId === table.id;
                        return (
                            <div key={table.id} className="flex flex-col gap-2">
                                <button
                                    onClick={() => {
                                        handleTableSelect(table.id);
                                        // Reset category when switching tables? Optional.
                                        // setActiveCategory(null);
                                    }}
                                    className={`w-full p-4 rounded-xl border-2 transition-all flex items-center justify-between ${
                                        isOccupied 
                                        ? 'bg-red-50 border-red-200 hover:border-red-400' 
                                        : 'bg-green-50 border-green-200 hover:border-green-400'
                                    } ${isSelected ? 'ring-2 ring-[--primary] ring-offset-2' : ''}`}
                                >
                                    <span className="font-bold text-gray-700 text-lg">{table.label || 'Tavolo'}</span>
                                    <span className={`text-xs px-3 py-1 rounded-full font-medium ${isOccupied ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                                        {isOccupied ? 'Occupato' : 'Libero'}
                                    </span>
                                </button>
                                
                                {/* Categories and Items - Only visible if table is selected */}
                                {isSelected && (
                                    <div className="ml-4 pl-4 border-l-2 border-gray-200 flex flex-col gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
                                        {CATEGORIES.map(cat => {
                                            const isCatActive = activeCategory === cat;
                                            const catItems = menuItems.filter(i => i.category === cat && i.available);
                                            
                                            return (
                                                <div key={cat} className="flex flex-col">
                                                    <button
                                                        onClick={() => setActiveCategory(isCatActive ? null : cat)}
                                                        className={`text-left px-3 py-2 rounded-lg font-medium text-sm flex justify-between items-center transition-colors ${
                                                            isCatActive 
                                                            ? 'bg-[--primary] text-white shadow-sm' 
                                                            : 'text-gray-600 hover:bg-gray-100'
                                                        }`}
                                                    >
                                                        {cat}
                                                        <span className={`text-xs px-1.5 py-0.5 rounded-full ${isCatActive ? 'bg-white/20' : 'bg-gray-200'}`}>
                                                            {catItems.length}
                                                        </span>
                                                    </button>
                                                    
                                                    {/* Menu Items for this Category */}
                                                    {isCatActive && (
                                                        <div className="mt-1 ml-2 flex flex-col gap-1 animate-in fade-in slide-in-from-top-1 duration-150">
                                                            {catItems.length === 0 ? (
                                                                <p className="text-xs text-gray-400 italic p-2">Nessun piatto</p>
                                                            ) : (
                                                                catItems.map(item => (
                                                                    <button
                                                                        key={item.id}
                                                                        onClick={() => handleAddToOrder(item)}
                                                                        className="text-left p-2 rounded hover:bg-orange-50 hover:text-orange-700 text-sm text-gray-600 border border-transparent hover:border-orange-100 transition-all flex justify-between items-center group"
                                                                    >
                                                                        <span className="truncate pr-2">{item.name}</span>
                                                                        <div className="flex items-center gap-2">
                                                                            <span className="text-xs font-semibold">€{item.price.toFixed(2)}</span>
                                                                            <Plus className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                                        </div>
                                                                    </button>
                                                                ))
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>

        {/* Center: Canvas Area */}
        <div className="flex-1 overflow-hidden bg-gray-100 relative">
            <div 
                ref={containerRef}
                className="w-full h-full"
            >
                <Stage 
                    width={stageSize.width} 
                    height={stageSize.height}
                    style={{ opacity: isLayoutReady ? 1 : 0, transition: 'opacity 0.3s ease-in' }}
                >
                    <Layer>
                        {/* Background fills the whole stage */}
                        <Rect 
                            width={stageSize.width} 
                            height={stageSize.height} 
                            fill="#ffffff" 
                            listening={false}
                        />
                        {/* Content is centered and scaled */}
                        <Group 
                            x={contentOffset.x} 
                            y={contentOffset.y} 
                            scaleX={scale} 
                            scaleY={scale}
                        >
                            {elementi.map((el) => {
                                 const isSelected = selectedTableId === el.id;
                                 const fillColor = el.type === 'rect' ? getTableColor(el.id) : undefined;
                                 
                                 return (
                                    <ElementoCanvas
                                        key={el.id}
                                        elemento={el}
                                        isSelected={isSelected}
                                        onSelect={() => handleTableSelect(el.id)}
                                        onDragEnd={() => {}}
                                        onTransformEnd={() => {}}
                                        readOnly={true}
                                        fillColor={fillColor}
                                    />
                                 );
                            })}
                        </Group>
                    </Layer>
                </Stage>
            </div>
        </div>

        {/* Right Sidebar: Order Detail */}
        {selectedTableId && (
            <div className="w-[30%] min-w-[320px] bg-white border-l border-gray-200 flex flex-col shadow-lg z-10 shrink-0">
                <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                    <div>
                        <h2 className="font-bold text-lg text-gray-800">{selectedTableLabel}</h2>
                        <p className="text-sm text-gray-500">
                            {currentOrder ? 'Occupato' : 'Libero'}
                        </p>
                    </div>
                    <button onClick={() => setSelectedTableId(null)} className="text-gray-400 hover:text-gray-600">
                        Chiudi
                    </button>
                </div>
                
                {/* Current Order List */}
                <div className="flex-1 overflow-y-auto p-4">
                    <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                        <ShoppingCart className="w-4 h-4" /> Ordine Corrente
                    </h3>
                    {currentOrder && currentOrder.items.length > 0 ? (
                        <ul className="space-y-2">
                            {currentOrder.items.map(item => (
                                <li key={item.menuItemId} className="flex justify-between items-center bg-gray-50 p-2 rounded border border-gray-100">
                                    <div>
                                        <div className="font-medium text-sm">{item.name}</div>
                                        <div className="text-xs text-gray-500">€ {item.price.toFixed(2)} x {item.quantity}</div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-sm">€ {(item.price * item.quantity).toFixed(2)}</span>
                                        <button 
                                            onClick={() => handleRemoveFromOrder(item.menuItemId)}
                                            className="text-red-400 hover:text-red-600 p-1"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-gray-400 text-sm italic">Nessun ordine attivo</p>
                    )}
                </div>

                {/* Total & Actions */}
                <div className="p-4 border-t border-gray-200 bg-gray-50 flex-shrink-0">
                    <div className="flex justify-between items-center mb-4">
                        <span className="font-bold text-gray-700">Totale</span>
                        <span className="font-bold text-xl text-[--primary]">€ {currentTotal.toFixed(2)}</span>
                    </div>
                    {currentOrder && (
                        <Bottone variante="pericolo" pienaLarghezza onClick={handleCloseOrder}>
                            Libera Tavolo / Chiudi Conto
                        </Bottone>
                    )}
                </div>
            </div>
        )}
      </div>
    </div>
  );
}