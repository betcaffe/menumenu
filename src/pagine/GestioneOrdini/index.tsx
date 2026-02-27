import React, { useState, useEffect, useRef } from 'react';
import { Stage, Layer, Rect, Group } from 'react-konva';
import { ShoppingCart, Plus, Trash2, X, ClipboardList, Utensils, Wine, Search } from 'lucide-react';
import ElementoCanvas from '../DisegnaRistorante/ElementoCanvas';
import { Elemento } from '../DisegnaRistorante/types';
import { MenuItem, MenuCategory, CATEGORIES, Order } from '../GestioneMenu/types';
import Bottone from '../../componenti/Bottone';
import Navbar from '../../componenti/Navbar';
import NotificaModal from '../../componenti/NotificaModal';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../supabaseClient';

import { Sidebar as SidebarContainer, SidebarItem } from '../../componenti/Sidebar';
import MobileStickyBar from '../../componenti/MobileStickyBar';

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
  const [mobileModalOpen, setMobileModalOpen] = useState(false);
  const [mobileSearchQuery, setMobileSearchQuery] = useState('');
  const [activeCourse, setActiveCourse] = useState<number>(1);
  const [mobileCourseSelections, setMobileCourseSelections] = useState<Record<number, Record<string, { item: MenuItem, qty: number }>>>({ 1: {}, 2: {}, 3: {} });
  const [isOrderSentModalOpen, setIsOrderSentModalOpen] = useState(false);
  const [isOrderInfoModalOpen, setIsOrderInfoModalOpen] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);

  // Persistenza bozze portate in DB
  const saveCourseDraft = async (course: number, selections: Record<string, { item: MenuItem, qty: number }>) => {
    try {
      if (!user || !restaurantId || !selectedTableId) return;
      const items = Object.values(selections).map(s => ({
        menu_item_id: s.item.id,
        name: s.item.name,
        price: s.item.price,
        qty: s.qty,
        category: s.item.category
      }));
      await supabase
        .from('order_drafts')
        .upsert([{
          user_id: user.id,
          restaurant_id: restaurantId,
          table_id: selectedTableId,
          course_number: course,
          items,
          updated_at: new Date().toISOString()
        }], { onConflict: 'user_id,restaurant_id,table_id,course_number' });
    } catch (e) {
      console.error('saveCourseDraft failed', e);
    }
  };

  const loadDraftsForTable = async (tableId: string) => {
    try {
      if (!user || !restaurantId) return;
      const { data, error } = await supabase
        .from('order_drafts')
        .select('course_number, items')
        .eq('user_id', user.id)
        .eq('restaurant_id', restaurantId)
        .eq('table_id', tableId);
      if (error) throw error;
      const next: Record<number, Record<string, { item: MenuItem, qty: number }>> = { 1: {}, 2: {}, 3: {} };
      (data || []).forEach((row: any) => {
        const course = row.course_number as number;
        const items = Array.isArray(row.items) ? row.items : [];
        const map: Record<string, { item: MenuItem, qty: number }> = {};
        items.forEach((it: any) => {
          map[it.menu_item_id] = { 
            item: { id: it.menu_item_id, name: it.name, price: it.price, category: it.category, available: true } as MenuItem, 
            qty: it.qty 
          };
        });
        next[course] = map;
      });
      setMobileCourseSelections(next);
    } catch (e) {
      console.error('loadDraftsForTable failed', e);
      setMobileCourseSelections({ 1: {}, 2: {}, 3: {} });
    }
  };
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

  // Helper to get scaled elements (convert meters to pixels if needed)
  const getScaledElements = () => {
    return elementi.map(el => {
        const isMetric = (el as any).normalized; // Cast because 'normalized' might be missing in type def in this file context if imports are not updated
        const ppm = isMetric ? 80 : 1;
        return {
            ...el,
            x: el.x * ppm,
            y: el.y * ppm,
            width: el.width ? el.width * ppm : undefined,
            height: el.height ? el.height * ppm : undefined,
            fontSize: el.fontSize ? el.fontSize * ppm : undefined
        };
    });
  };

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
    
            // Calculate content center using SCALED elements
            const scaledElements = getScaledElements();
            
            if (scaledElements.length > 0) {
                let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
                scaledElements.forEach(el => {
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
                
                // Limit max scale (zoom)
                newScale = Math.min(newScale, 1.5);
                
                // Prevent too small scale
                if (newScale < 0.1) newScale = 0.1;

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
      // Toggle selection: if already selected, deselect
      if (selectedTableId === id) {
        setSelectedTableId(null);
      } else {
        setSelectedTableId(id);
      }
    }
  };

  const handleAddToOrder = async (item: MenuItem) => {
    if (!user || !selectedTableId || !restaurantId || isAddingItem) return;
    setIsAddingItem(true);

    let orderId: string;

    // 1. Ottimistic update usando lo stato precedente, senza dipendere da 'orders' esterno
    const tempId = `temp-${Date.now()}`;
    
    // Optimistic Update
    setOrders(prev => {
      const idx = prev.findIndex(o => o.tableId === selectedTableId && o.status === 'active');
      const next = [...prev];
      if (idx >= 0) {
        const order = { ...next[idx] };
        order.items = [...order.items, {
          id: tempId,
          menuItemId: item.id,
          name: item.name,
          price: item.price,
          quantity: 1,
          created_at: new Date().toISOString()
        }];
        next[idx] = order;
      } else {
        next.push({
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
      return next;
    });

    // 2. DB Interaction
    try {
        // Verifica su DB: esiste già un ordine attivo per questo tavolo?
        const { data: existingDbOrders, error: findErr } = await supabase
          .from('orders')
          .select('id')
          .eq('restaurant_id', restaurantId)
          .eq('table_id', selectedTableId)
          .eq('status', 'active')
          .eq('user_id', user.id)
          .limit(1);
        if (findErr) throw findErr;

        const existingDbOrderId = Array.isArray(existingDbOrders) && existingDbOrders.length > 0 ? existingDbOrders[0].id : null;

        if (existingDbOrderId) {
          orderId = existingDbOrderId as string;
        } else {
          // Crea nuovo ordine in DB
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
            const next = [...prev];
            const orderIdx = next.findIndex(o => o.tableId === selectedTableId && o.status === 'active');
            if (orderIdx >= 0) {
              const order = { ...next[orderIdx] };
              if (!order.id) order.id = orderId;
              const itemIdx = order.items.findIndex(i => i.id === tempId);
              if (itemIdx >= 0 && newItemId) {
                order.items[itemIdx] = { ...order.items[itemIdx], id: newItemId };
              }
              next[orderIdx] = order;
            }
            return next;
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
    <div className="flex flex-col h-screen bg-gray-50 pb-20 md:pb-0">
      <Navbar 
        title="Sala & Ordini"
        icon={<ClipboardList className="w-6 h-6 sm:w-8 sm:h-8" />}
      />

      <div className="flex-1 flex overflow-hidden mt-16 sm:mt-20">
        {/* Left Sidebar: Tables List (Fixed width) */}
        <SidebarContainer className="w-full md:w-64 border-r md:border-gray-200 flex flex-col shadow-lg shrink-0 z-20 bg-white">
            <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                <h2 className="font-bold text-gray-800 text-lg">Tavoli</h2>
            </div>
            <div className="flex-1 overflow-y-auto">
                {tables.map(table => {
                    const isOccupied = getTableStroke(table.id) === '#ef4444';
                    const isSelected = selectedTableId === table.id;
                    const statusColor = isOccupied ? 'red' : 'green';
                    
                    return (
                        <React.Fragment key={table.id}>
                            <SidebarItem
                                label={table.label || 'Tavolo'}
                                active={isSelected}
                                color={statusColor}
                            onClick={() => {
                              setSelectedTableId(table.id);
                              if (window.matchMedia('(max-width: 767px)').matches) {
                                setMobileModalOpen(true);
                                setMobileSearchQuery('');
                                setActiveCourse(1);
                                loadDraftsForTable(table.id);
                              } else {
                                setActiveCategory(null);
                              }
                            }}
                                rightElement={
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                        isOccupied ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                                    }`}>
                                        {isOccupied ? 'Occupato' : 'Libero'}
                                    </span>
                                }
                            />
                            
                            {/* Search bar and filtered items */}
                        {isSelected && (
                            <div className="hidden md:flex md:flex-col pl-4 border-l-4 border-gray-200 gap-3 animate-in fade-in slide-in-from-top-2 duration-200 bg-gray-50/50 p-2">
                                    {CATEGORIES.map(cat => {
                                        const isCatActive = activeCategory === cat;
                                        const catItems = menuItems.filter(i => i.category === cat && i.available);
                                        
                                        return (
                                            <div key={cat} className="flex flex-col">
                                                <button
                                                    onClick={() => setActiveCategory(isCatActive ? null : cat)}
                                                    className={`text-left px-3 py-2 rounded-lg font-medium flex justify-between items-center transition-colors ${
                                                        isCatActive 
                                                        ? 'bg-[--primary] text-white shadow-sm' 
                                                        : 'text-gray-600 hover:bg-gray-100'
                                                    }`}
                                                >
                                                    {cat}
                                                    <span className={`px-2 py-0.5 rounded-full text-xs ${isCatActive ? 'bg-white/20' : 'bg-gray-200'}`}>
                                                        {catItems.length}
                                                    </span>
                                                </button>
                                                
                                                {isCatActive && (
                                                    <div className="mt-2 ml-3 flex flex-col gap-2 animate-in fade-in slide-in-from-top-1 duration-150">
                                                        {catItems.length === 0 ? (
                                                            <p className="text-gray-400 italic px-3 text-sm">Nessun piatto</p>
                                                        ) : (
                                                            catItems.map(item => (
                                                                <button
                                                                    key={item.id}
                                                                    onClick={() => handleAddToOrder(item)}
                                                                    className="text-left p-3 rounded hover:bg-orange-50 hover:text-orange-700 text-gray-600 border border-transparent hover:border-orange-100 transition-all flex justify-between items-center group text-sm"
                                                                >
                                                                    <span className="truncate pr-2">{item.name}</span>
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="font-semibold hidden md:inline text-xs">€{item.price.toFixed(2)}</span>
                                                                        <Plus className="w-4 h-4 text-[--primary] opacity-0 group-hover:opacity-100 transition-opacity" />
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
                        </React.Fragment>
                    );
                })}
            </div>
        </SidebarContainer>

        {/* Center: Canvas Area (Flex grow) */}
        <div className="hidden md:block flex-1 overflow-hidden bg-gray-100 relative">
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
                            {getScaledElements().map((el) => {
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

        {/* Right Sidebar: Order Detail (Fixed width) - Always Visible */}
        <SidebarContainer className="hidden md:flex w-80 border-l border-r-0 border-gray-200 flex flex-col shadow-lg shrink-0 z-20 bg-white">
            {selectedTableId ? (
                <>
                    <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between min-h-[60px]">
                        <div>
                            <h2 className="font-bold text-gray-800 text-lg">{selectedTableLabel}</h2>
                            <p className="text-gray-500 text-sm">
                                {currentOrder ? 'Occupato' : 'Libero'}
                            </p>
                        </div>
                        <button onClick={() => setSelectedTableId(null)} className="p-2 bg-white hover:bg-gray-100 rounded-full text-gray-500 hover:text-gray-700 transition-colors border border-gray-200">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto bg-white">
                        {!currentOrder || currentOrder.items.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-4 p-4">
                                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center">
                                    <ShoppingCart className="w-8 h-8 opacity-20" />
                                </div>
                                <div className="text-center">
                                    <p className="font-medium text-gray-600 text-lg">Nessun ordine attivo</p>
                                    <p className="text-sm">Seleziona i piatti dal menu a sinistra</p>
                                </div>
                            </div>
                        ) : (
                            <div className="w-full">
                                {groupedItems.map((item) => (
                                    <div key={item.menuItemId} className="flex justify-between items-center p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors group">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-[--primary]/10 rounded flex items-center justify-center text-[--primary] font-bold text-sm">
                                                {item.quantity}x
                                            </div>
                                            <div className="min-w-0">
                                                <h4 className="font-bold text-gray-800 text-sm truncate max-w-[120px]" title={item.name}>{item.name}</h4>
                                                <p className="text-gray-500 text-xs">€ {item.price.toFixed(2)}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="font-bold text-gray-800 text-sm whitespace-nowrap">
                                                € {item.totalPrice.toFixed(2)}
                                            </span>
                                            <button 
                                                onClick={() => handleRemoveFromOrder(item.menuItemId)}
                                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                                title="Rimuovi"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="p-4 border-t border-gray-200 bg-gray-50 shrink-0 z-40">
                        <div className="flex justify-between items-center mb-4 w-full">
                            <span className="text-gray-600 font-medium">Totale</span>
                            <span className="font-bold text-[--primary] text-2xl">€ {currentTotal.toFixed(2)}</span>
                        </div>
                        <div className="w-full">
                            {currentOrder && currentOrder.items.length > 0 && (
                                <Bottone 
                                    onClick={handleCloseOrder}
                                    variante="pericolo"
                                    className="w-full justify-center"
                                >
                                    Chiudi Conto
                                </Bottone>
                            )}
                        </div>
                    </div>
                </>
            ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-4 p-8">
                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center">
                        <ClipboardList className="w-10 h-10 opacity-20" />
                    </div>
                    <div className="text-center">
                        <p className="font-medium text-gray-600 text-xl">Conto</p>
                        <p className="text-sm mt-1">Seleziona un tavolo</p>
                    </div>
                </div>
            )}
        </SidebarContainer>
      </div>
      {mobileModalOpen && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center md:hidden p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setMobileModalOpen(false)}
        >
          <div 
            className="bg-white rounded-2xl w-[94%] shadow-2xl overflow-hidden relative flex flex-col h-[82vh] max-h-[82vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50 shrink-0">
              <h3 className="font-bold text-lg">{selectedTableLabel}</h3>
              <button onClick={() => setMobileModalOpen(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-4 flex flex-col flex-1 overflow-hidden">
              <div className="mb-2 flex items-center gap-2">
                <span className="text-xs font-bold text-gray-600">N° portate</span>
                <div className="flex items-center gap-2">
                  <button onClick={() => setActiveCourse(1)} className={`px-3 py-1 rounded-lg text-sm ${activeCourse === 1 ? 'bg-[--primary] text-white' : 'bg-gray-100 text-gray-700'}`}>1</button>
                  <button onClick={() => setActiveCourse(2)} className={`px-3 py-1 rounded-lg text-sm ${activeCourse === 2 ? 'bg-[--primary] text-white' : 'bg-gray-100 text-gray-700'}`}>2</button>
                  <button onClick={() => setActiveCourse(3)} className={`px-3 py-1 rounded-lg text-sm ${activeCourse === 3 ? 'bg-[--primary] text-white' : 'bg-gray-100 text-gray-700'}`}>3</button>
                </div>
              </div>
              <div className="relative mb-3 shrink-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Cerca piatto..."
                  value={mobileSearchQuery}
                  onChange={(e) => setMobileSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-3 py-3 bg-gray-100 border-none rounded-xl text-base focus:ring-2 focus:ring-[--primary] outline-none transition-all"
                />
              </div>

              <div className="flex-1 overflow-y-auto mb-3 min-h-0 pr-1">
                <div className="grid grid-cols-1 gap-2">
                  {mobileSearchQuery === '' ? (
                      <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                          <Search className="w-10 h-10 mb-3 opacity-20" />
                          <p className="italic text-xs text-center px-8">Cerca i piatti da aggiungere...</p>
                      </div>
                  ) : (
                      menuItems
                        .filter(item => {
                          if (!item.available) return false;
                          
                          const queryTerms = mobileSearchQuery.toLowerCase().trim().split(/\s+/);
                          const itemNameWords = item.name.toLowerCase().split(/\s+/);
                          const categoryLower = item.category.toLowerCase();

                          return queryTerms.every(term => 
                            itemNameWords.some(word => word.startsWith(term)) ||
                            categoryLower.startsWith(term)
                          );
                        })
                        .map(item => {
                          const sel = mobileCourseSelections[activeCourse][item.id];
                          return (
                            <div key={item.id} className="flex items-center justify-between p-3 border rounded-xl bg-white shadow-sm">
                              <div className="min-w-0 flex-1 mr-3">
                                <div className="font-bold text-gray-800 truncate">{item.name}</div>
                              </div>
                              <div className="flex items-center gap-3 shrink-0">
                                <button
                                  onClick={() => {
                                    const qty = (sel?.qty || 0) - 1;
                                    const next = { ...mobileCourseSelections[activeCourse] };
                                    if (qty <= 0) {
                                      delete next[item.id];
                                    } else {
                                      next[item.id] = { item, qty };
                                    }
                                    setMobileCourseSelections(prev => ({ ...prev, [activeCourse]: next }));
                                    saveCourseDraft(activeCourse, next);
                                  }}
                                  className="w-8 h-8 rounded-full bg-gray-100 text-gray-700 flex items-center justify-center font-bold"
                                >
                                  -
                                </button>
                                <span className="w-6 text-center font-bold text-lg">{sel?.qty || 0}</span>
                                <button
                                  onClick={() => {
                                    const qty = (sel?.qty || 0) + 1;
                                    const next = {
                                      ...mobileCourseSelections[activeCourse],
                                      [item.id]: { item, qty }
                                    };
                                    setMobileCourseSelections(prev => ({ ...prev, [activeCourse]: next }));
                                    saveCourseDraft(activeCourse, next);
                                  }}
                                  className="w-8 h-8 rounded-full bg-[--secondary] text-white flex items-center justify-center font-bold"
                                >
                                  +
                                </button>
                              </div>
                            </div>
                          );
                        })
                  )}
                </div>
              </div>

              <div className="border-t pt-3 shrink-0">
                <div className="mb-2">
                  <span className="text-gray-600 font-bold text-xs uppercase tracking-wider">Articoli selezionati</span>
                </div>
                <div className="max-h-32 overflow-y-auto mb-3 bg-gray-50 rounded-xl p-2 border border-gray-100">
                  {Object.values(mobileCourseSelections[activeCourse]).length === 0 ? (
                    <div className="text-gray-400 text-xs italic text-center py-2">Nessun articolo selezionato</div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {Object.values(mobileCourseSelections[activeCourse]).map(s => (
                        <div key={s.item.id} className="flex justify-between items-center text-sm bg-white p-2 rounded-lg border border-gray-100 shadow-sm">
                          <span className="truncate font-medium flex-1 mr-2">{s.item.name}</span>
                          <span className="font-bold text-[--primary] shrink-0 text-base">x{s.qty}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <Bottone
                  variante="primario"
                  pienaLarghezza
                  className="justify-center py-3 font-bold text-lg"
                  onClick={async () => {
                    if (!selectedTableId) return;
                    const selectionCounts: Record<string, number> = {};
                    Object.values(mobileCourseSelections[activeCourse]).forEach(s => {
                      selectionCounts[s.item.id] = (selectionCounts[s.item.id] || 0) + s.qty;
                    });
                    const currentCounts: Record<string, number> = {};
                    (currentOrder?.items || []).forEach(i => {
                      currentCounts[i.menuItemId] = (currentCounts[i.menuItemId] || 0) + i.quantity;
                    });
                    const allKeys = new Set<string>([
                      ...Object.keys(selectionCounts),
                      ...Object.keys(currentCounts)
                    ]);
                    let identical = true;
                    let hasAdd = false;
                    let hasRemove = false;
                    allKeys.forEach(k => {
                      const sel = selectionCounts[k] || 0;
                      const cur = currentCounts[k] || 0;
                      if (sel !== cur) identical = false;
                      if (sel > cur) hasAdd = true;
                      if (sel < cur) hasRemove = true;
                    });
                    if (identical) {
                      setIsOrderInfoModalOpen(true);
                      setTimeout(() => setIsOrderInfoModalOpen(false), 2000);
                      return;
                    }
                    if (currentOrder?.id && hasAdd && hasRemove) {
                      try {
                        await supabase.from('order_items').delete().eq('order_id', currentOrder.id);
                        const { data: newOrder, error } = await supabase
                          .from('orders')
                          .insert([{
                            user_id: user!.id,
                            restaurant_id: restaurantId!,
                            table_id: selectedTableId,
                            status: 'active'
                          }])
                          .select()
                          .single();
                        if (error) throw error;
                        for (const s of Object.values(mobileCourseSelections[activeCourse])) {
                          for (let i = 0; i < s.qty; i++) {
                            await supabase.rpc('add_item_to_order', {
                              p_order_id: newOrder.id,
                              p_menu_item_id: s.item.id,
                              p_name: s.item.name,
                              p_price: s.item.price,
                              p_category: s.item.category
                            });
                          }
                        }
                        setOrders(prev => {
                          const next = [...prev.filter(o => o.tableId !== selectedTableId || o.status !== 'active')];
                          next.push({
                            id: newOrder.id,
                            tableId: selectedTableId,
                            status: 'active',
                            timestamp: Date.now(),
                            items: Object.values(mobileCourseSelections[activeCourse]).flatMap(s =>
                              Array.from({ length: s.qty }).map((_ , idx) => ({
                                id: `temp-${s.item.id}-${Date.now()}-${idx}`,
                                menuItemId: s.item.id,
                                quantity: 1,
                                name: s.item.name,
                                price: s.item.price,
                                created_at: new Date().toISOString()
                              }))
                            )
                          });
                          return next;
                        });
                        setIsOrderSentModalOpen(true);
                        setTimeout(() => setIsOrderSentModalOpen(false), 2000);
                      } catch (e) {
                        alert("Errore nella sostituzione della comanda");
                      }
                    } else {
                      for (const s of Object.values(mobileCourseSelections[activeCourse])) {
                        const cur = currentCounts[s.item.id] || 0;
                        const addDelta = s.qty - cur;
                        for (let i = 0; i < addDelta; i++) {
                          await handleAddToOrder(s.item);
                        }
                      }
                      for (const k of Object.keys(currentCounts)) {
                        const sel = selectionCounts[k] || 0;
                        const cur = currentCounts[k] || 0;
                        const removeDelta = cur - sel;
                        for (let i = 0; i < removeDelta; i++) {
                          await handleRemoveFromOrder(k);
                        }
                      }
                      setIsOrderSentModalOpen(true);
                      setTimeout(() => setIsOrderSentModalOpen(false), 2000);
                    }
                    if (selectedTableId) {
                      await saveCourseDraft(activeCourse, mobileCourseSelections[activeCourse]);
                    }
                    if (restaurantId) {
                      const { data: activeOrders } = await supabase
                        .from('orders')
                        .select(`
                            *,
                            order_items (*)
                        `)
                        .eq('restaurant_id', restaurantId)
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
                    setMobileModalOpen(false);
                  }}
                >
                  Invia Comanda ({Object.values(mobileCourseSelections[activeCourse]).reduce((sum, s) => sum + s.qty, 0)})
                </Bottone>
              </div>
            </div>
          </div>
        </div>
      )}
      <NotificaModal
        open={isOrderSentModalOpen}
        onClose={() => setIsOrderSentModalOpen(false)}
        title="Ordine inviato"
        message="La comanda è stata inviata correttamente."
        variant="success"
        autoCloseMs={2000}
      />
      <NotificaModal
        open={isOrderInfoModalOpen}
        onClose={() => setIsOrderInfoModalOpen(false)}
        title="Comanda già inviata"
        message="Gli articoli e le quantità sono uguali."
        variant="info"
        autoCloseMs={2000}
      />
      <MobileStickyBar
        activeKey="ordini"
        defaultInactiveClass="bg-[--secondary] text-white"
        defaultActiveClass="bg-[--primary] text-white"
        items={[
          { key: 'ordini', to: '/gestione-ordini', label: 'Ordini', icon: <ClipboardList className="w-6 h-6" /> },
          { key: 'cucina', to: '/gestione-cucina', label: 'Cucina', icon: <Utensils className="w-6 h-6" /> },
          { key: 'bar', to: '/gestione-bar', label: 'Bar', icon: <Wine className="w-6 h-6" /> },
        ]}
      />
    </div>
  );
}
