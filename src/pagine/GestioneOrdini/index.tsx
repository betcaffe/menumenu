import { useState, useEffect, useRef } from 'react';
import { Stage, Layer, Rect, Group } from 'react-konva';
import { ChefHat, ShoppingCart, Plus, Trash2, X } from 'lucide-react';
import ElementoCanvas from '../DisegnaRistorante/ElementoCanvas';
import { Elemento } from '../DisegnaRistorante/types';
import { MenuItem, MenuCategory, CATEGORIES, Order } from '../GestioneMenu/types';
import Bottone from '../../componenti/Bottone';
import Header from '../../componenti/Header';
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
  const [isAddingItem, setIsAddingItem] = useState(false);
  
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
                        id: i.id,
                        menuItemId: i.menu_item_id,
                        quantity: i.quantity,
                        name: i.name,
                        price: i.price,
                        created_at: i.created_at
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
  }, [elementi, selectedTableId]); // Re-calculate when elements change or layout changes

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
    if (!user || !selectedTableId || !restaurantId || isAddingItem) return;
    setIsAddingItem(true);

    let orderId: string;
    let newOrderCreated = false;

    // 1. Check local state for active order
    const existingOrderIndex = orders.findIndex(o => o.tableId === selectedTableId && o.status === 'active');
    const tempId = `temp-${Date.now()}`;
    
    // Optimistic Update
    setOrders(prev => {
      let newOrders = [...prev];
      if (existingOrderIndex >= 0) {
        // Update existing
        const order = { ...newOrders[existingOrderIndex] };
        // Create a copy of items array to avoid mutating state directly
        order.items = [...order.items, { 
            id: tempId,
            menuItemId: item.id, 
            name: item.name, 
            price: item.price, 
            quantity: 1,
            created_at: new Date().toISOString()
        }];
        newOrders[existingOrderIndex] = order;
      } else {
        // Create new
        newOrders.push({
            tableId: selectedTableId,
            status: 'active',
            timestamp: Date.now(),
            items: [{ 
                id: tempId,
                menuItemId: item.id, 
                name: item.name, 
                price: item.price, 
                quantity: 1,
                created_at: new Date().toISOString()
            }]
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
                    user_id: user.id,
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

        // 3. Add/Update Item in DB via RPC (Atomic to prevent race conditions)
        const { data: newItemId, error: rpcError } = await supabase.rpc('add_item_to_order', {
            p_order_id: orderId,
            p_menu_item_id: item.id,
            p_name: item.name,
            p_price: item.price,
            p_category: item.category
        });
        
        if (rpcError) throw rpcError;

        // If we created a new order, update the local state with the ID
        // And update the item ID with the real one from DB
        setOrders(prev => {
            const newOrders = [...prev];
            const orderIdx = newOrders.findIndex(o => o.tableId === selectedTableId && o.status === 'active');
            
            if (orderIdx >= 0) {
                const order = { ...newOrders[orderIdx] };
                if (newOrderCreated && !order.id) order.id = orderId;
                
                const itemIdx = order.items.findIndex(i => i.id === tempId);
                if (itemIdx >= 0 && newItemId) {
                    order.items[itemIdx] = { ...order.items[itemIdx], id: newItemId };
                }
                newOrders[orderIdx] = order;
            }
            return newOrders;
        });

    } catch (e) {
        console.error("Error adding to order:", e);
        // Revert optimistic update? Or just alert.
        alert("Errore nell'aggiornamento dell'ordine");
    } finally {
        setIsAddingItem(false);
    }
  };

  const handleRemoveFromOrder = async (menuItemId: string) => {
    if (!selectedTableId || !restaurantId) return;
    
    const orderIndex = orders.findIndex(o => o.tableId === selectedTableId && o.status === 'active');
    if (orderIndex === -1) return;

    const order = orders[orderIndex];
    if (!order.id) return; // Should have ID by now

    // Find the last item with this menuItemId to remove
    // We remove the last one added (LIFO for removal)
    const reversedIndex = [...order.items].reverse().findIndex(i => i.menuItemId === menuItemId);
    
    if (reversedIndex === -1) return;
    
    const itemIndex = order.items.length - 1 - reversedIndex;
    const itemToRemove = order.items[itemIndex];

    if (!itemToRemove.id) return; // Wait for ID to be assigned

    // Optimistic Update
    setOrders(prev => {
      const newOrders = [...prev];
      const currentOrder = { ...newOrders[orderIndex] };
      
      // Create a copy of items array to avoid mutating state directly
      currentOrder.items = [...currentOrder.items];
      currentOrder.items.splice(itemIndex, 1);
      
      if (currentOrder.items.length === 0) {
          newOrders.splice(orderIndex, 1);
      } else {
          newOrders[orderIndex] = currentOrder;
      }
      return newOrders;
    });

    // DB Interaction
    try {
        await supabase
            .from('order_items')
            .delete()
            .eq('id', itemToRemove.id);
            
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

  // Group items for display
  const groupedItems = currentOrder ? currentOrder.items.reduce((acc, item) => {
      const existing = acc.find(g => g.menuItemId === item.menuItemId);
      if (existing) {
          existing.quantity += item.quantity;
          existing.totalPrice += (item.price * item.quantity);
      } else {
          acc.push({
              menuItemId: item.menuItemId,
              name: item.name,
              price: item.price,
              quantity: item.quantity,
              totalPrice: item.price * item.quantity
          });
      }
      return acc;
  }, [] as { menuItemId: string, name: string, price: number, quantity: number, totalPrice: number }[]) : [];

  // Filter only table elements for the list
  const tables = elementi.filter(el => el.type === 'rect');

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <Header 
        title="Sala & Ordini" 
        icon={<ChefHat className="w-6 h-6 text-[--primary]" />}
        backLink="/dashboard"
      />

      <div className="flex flex-1 overflow-hidden relative">
        {/* Left Sidebar: Tables List (25% width) */}
        <div className="w-[25%] border-r border-gray-200 flex flex-col shadow-lg shrink-0 z-20 bg-white">
            <div className="p-[1.5vw] border-b border-gray-200 bg-gray-50 flex justify-between items-center h-[8%] min-h-[60px]">
                <div>
                    <h2 className="font-bold text-gray-800" style={{ fontSize: '2vw' }}>Tavoli</h2>
                </div>
            </div>
            <div className="flex-1 overflow-y-auto p-[1.5vw]">
                <div className="flex flex-col gap-[1.2vw]">
                    {tables.map(table => {
                        const isOccupied = getTableStroke(table.id) === '#ef4444';
                        const isSelected = selectedTableId === table.id;
                        return (
                            <div key={table.id} className="flex flex-col gap-[1vw]">
                                <button
                                    onClick={() => {
                                        handleTableSelect(table.id);
                                    }}
                                    className={`w-full p-[1.5vw] rounded-xl border transition-all flex items-center justify-between ${
                                        isOccupied 
                                        ? 'bg-red-50 border-red-200 hover:border-red-400' 
                                        : 'bg-green-50 border-green-200 hover:border-green-400'
                                    } ${isSelected ? 'ring-4 ring-[--primary] ring-offset-2' : ''}`}
                                >
                                    <span className="font-bold text-gray-700" style={{ fontSize: '1.5vw' }}>{table.label || 'Tavolo'}</span>
                                    <span className={`px-[0.8vw] py-[0.4vw] rounded-full font-medium ${isOccupied ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`} style={{ fontSize: '1.1vw' }}>
                                        {isOccupied ? 'Occupato' : 'Libero'}
                                    </span>
                                </button>
                                
                                {/* Categories and Items - Only visible if table is selected */}
                                {isSelected && (
                                    <div className="ml-[1.5vw] pl-[1.5vw] border-l-4 border-gray-200 flex flex-col gap-[1vw] animate-in fade-in slide-in-from-top-2 duration-200">
                                        {CATEGORIES.map(cat => {
                                            const isCatActive = activeCategory === cat;
                                            const catItems = menuItems.filter(i => i.category === cat && i.available);
                                            
                                            return (
                                                <div key={cat} className="flex flex-col">
                                                    <button
                                                        onClick={() => setActiveCategory(isCatActive ? null : cat)}
                                                        className={`text-left px-[1vw] py-[1vw] rounded-lg font-medium flex justify-between items-center transition-colors ${
                                                            isCatActive 
                                                            ? 'bg-[--primary] text-white shadow-sm' 
                                                            : 'text-gray-600 hover:bg-gray-100'
                                                        }`}
                                                        style={{ fontSize: '1.3vw' }}
                                                    >
                                                        {cat}
                                                        <span className={`px-[0.6vw] py-[0.2vw] rounded-full ${isCatActive ? 'bg-white/20' : 'bg-gray-200'}`} style={{ fontSize: '1.1vw' }}>
                                                            {catItems.length}
                                                        </span>
                                                    </button>
                                                    
                                                    {/* Menu Items for this Category */}
                                                    {isCatActive && (
                                                        <div className="mt-[0.6vw] ml-[1vw] flex flex-col gap-[0.6vw] animate-in fade-in slide-in-from-top-1 duration-150">
                                                            {catItems.length === 0 ? (
                                                                <p className="text-gray-400 italic p-[1vw]" style={{ fontSize: '1.1vw' }}>Nessun piatto</p>
                                                            ) : (
                                                                catItems.map(item => (
                                                                    <button
                                                                        key={item.id}
                                                                        onClick={() => handleAddToOrder(item)}
                                                                        className="text-left p-[1vw] rounded hover:bg-orange-50 hover:text-orange-700 text-gray-600 border border-transparent hover:border-orange-100 transition-all flex justify-between items-center group"
                                                                        style={{ fontSize: '1.2vw' }}
                                                                    >
                                                                        <span className="truncate pr-[0.8vw]">{item.name}</span>
                                                                        <div className="flex items-center gap-[0.8vw]">
                                                                            <span className="font-semibold">€{item.price.toFixed(2)}</span>
                                                                            <Plus className="opacity-0 group-hover:opacity-100 transition-opacity" style={{ width: '1vw', height: '1vw' }} />
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

        {/* Center: Canvas Area (50% width) */}
        <div className="w-[50%] overflow-hidden bg-gray-100 relative">
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

        {/* Right Sidebar: Order Detail (25% width) - Always Visible */}
        <div className="w-[25%] border-l border-gray-200 flex flex-col shadow-lg shrink-0 z-20 bg-white">
            {selectedTableId ? (
                <>
                    <div className="p-[1.5vw] border-b border-gray-200 bg-gray-50 flex items-center justify-between h-[8%] min-h-[60px]">
                        <div>
                            <h2 className="font-bold text-gray-800" style={{ fontSize: '2vw' }}>{selectedTableLabel}</h2>
                            <p className="text-gray-500" style={{ fontSize: '1.2vw' }}>
                                {currentOrder ? 'Occupato' : 'Libero'}
                            </p>
                        </div>
                        <button onClick={() => setSelectedTableId(null)} className="p-[1vw] bg-white rounded-full shadow-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors border border-gray-200">
                            <X style={{ width: '2vw', height: '2vw' }} />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-[1.5vw] bg-gray-50/50">
                        {!currentOrder || currentOrder.items.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-[1.5vw]">
                                <div className="w-[8vw] h-[8vw] bg-gray-100 rounded-full flex items-center justify-center">
                                    <ShoppingCart className="opacity-20" style={{ width: '4vw', height: '4vw' }} />
                                </div>
                                <div className="text-center">
                                    <p className="font-medium text-gray-600" style={{ fontSize: '1.5vw' }}>Nessun ordine attivo</p>
                                    <p style={{ fontSize: '1.2vw' }}>Seleziona i piatti dal menu a sinistra</p>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-[1.5vw] w-full">
                                {groupedItems.map((item) => (
                                    <div key={item.menuItemId} className="flex justify-between items-center p-[1.5vw] bg-white rounded-xl border border-gray-200 shadow-sm hover:border-[--primary] transition-colors group">
                                        <div className="flex items-center gap-[1.5vw]">
                                            <div className="w-[3.5vw] h-[3.5vw] bg-[--primary]/10 rounded-full flex items-center justify-center text-[--primary] font-bold" style={{ fontSize: '1.3vw' }}>
                                                {item.quantity}x
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-gray-800" style={{ fontSize: '1.5vw' }}>{item.name}</h4>
                                                <p className="text-gray-500" style={{ fontSize: '1.2vw' }}>€ {item.price.toFixed(2)} cad.</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-[1.5vw]">
                                            <span className="font-bold text-gray-800 text-right" style={{ fontSize: '1.5vw' }}>
                                                € {item.totalPrice.toFixed(2)}
                                            </span>
                                            <button 
                                                onClick={() => handleRemoveFromOrder(item.menuItemId)}
                                                className="p-[1vw] text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Rimuovi"
                                            >
                                                <Trash2 style={{ width: '2vw', height: '2vw' }} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="p-[1.5vw] border-t border-gray-200 bg-white shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] shrink-0 z-40">
                        <div className="flex justify-between items-center mb-[1.5vw] w-full">
                            <span className="text-gray-500 font-medium" style={{ fontSize: '1.5vw' }}>Totale Complessivo</span>
                            <span className="font-bold text-[--primary]" style={{ fontSize: '2.2vw' }}>€ {currentTotal.toFixed(2)}</span>
                        </div>
                        <div className="flex gap-[1.5vw] w-full">
                            {currentOrder && currentOrder.items.length > 0 && (
                                <Bottone 
                                    onClick={handleCloseOrder}
                                    variante="pericolo"
                                    className="flex-1"
                                    style={{ fontSize: '1.5vw', padding: '1.5vw' }}
                                >
                                    Chiudi Conto e Libera
                                </Bottone>
                            )}
                        </div>
                    </div>
                </>
            ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-[1.5vw] p-[3vw]">
                    <div className="w-[10vw] h-[10vw] bg-gray-100 rounded-full flex items-center justify-center">
                        <ShoppingCart className="opacity-20" style={{ width: '5vw', height: '5vw' }} />
                    </div>
                    <div className="text-center">
                        <p className="font-medium text-gray-600" style={{ fontSize: '2vw' }}>Conto</p>
                        <p style={{ fontSize: '1.3vw' }}>Seleziona un tavolo per visualizzare il conto</p>
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
}