import { useState, useEffect } from 'react';
import { CheckCircle, Clock, Loader2, Wine, ClipboardList, Utensils, X } from 'lucide-react';
import Navbar from '../../componenti/Navbar';
import Bottone from '../../componenti/Bottone';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../supabaseClient';
import { OrderItem, MenuCategory } from '../GestioneMenu/types';
import MobileStickyBar from '../../componenti/MobileStickyBar';
import { Sidebar as SidebarContainer, SidebarItem } from '../../componenti/Sidebar';

interface DisplayOrder {
    orderId: string;
    tableId: string;
    items: OrderItem[];
    timestamp: number;
}

const BAR_CATEGORIES: MenuCategory[] = ['Bevande', 'Vini'];

export default function GestioneBar() {
    const { user } = useAuth();
    const [orders, setOrders] = useState<DisplayOrder[]>([]);
    const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
    const [isMobileDetailOpen, setIsMobileDetailOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [_restaurantId, setRestaurantId] = useState<string | null>(null);
    const [tableMap, setTableMap] = useState<Record<string, string>>({});

    // Fetch initial data and subscribe to changes
    useEffect(() => {
        if (!user) return;

        let channel: any;

        const init = async () => {
            try {
                // 1. Get Restaurant ID and Layout
                const { data: restaurant } = await supabase
                    .from('restaurants')
                    .select('id, layout')
                    .eq('user_id', user.id)
                    .single();

                if (!restaurant) return;
                setRestaurantId(restaurant.id);

                // Build Table Map
                if (restaurant.layout) {
                    const parsed = restaurant.layout as any;
                    const map: Record<string, string> = {};
                    if (parsed.elementi && Array.isArray(parsed.elementi)) {
                        parsed.elementi.forEach((el: any) => {
                            if (el.id && el.label) {
                                map[el.id] = el.label;
                            }
                        });
                    }
                    setTableMap(map);
                }

                // 2. Fetch Active Orders with Items
                // We need to fetch orders that have items in the Bar categories
                // This is a bit complex with a single query, so we'll fetch active orders and filter
                await fetchOrders(restaurant.id);

                // 3. Subscribe to changes
                channel = supabase
                    .channel('bar-orders')
                    .on(
                        'postgres_changes',
                        {
                            event: '*',
                            schema: 'public',
                            table: 'order_items',
                        },
                        (payload) => {
                            // On any change to items, refresh the orders
                            // Optimization: We could be smarter here, but refreshing is safer for consistency
                            console.log('Change received!', payload);
                            fetchOrders(restaurant.id);
                        }
                    )
                    .on(
                        'postgres_changes',
                        {
                            event: 'UPDATE', // Only care if status changes to completed
                            schema: 'public',
                            table: 'orders',
                        },
                        (_payload) => {
                            fetchOrders(restaurant.id);
                        }
                    )
                    .subscribe();

            } catch (error) {
                console.error("Error initializing bar:", error);
            } finally {
                setLoading(false);
            }
        };

        init();

        return () => {
            if (channel) supabase.removeChannel(channel);
        };
    }, [user]);

    const fetchOrders = async (_restId: string) => {
        const { data: activeOrders, error } = await supabase
            .from('orders')
            .select(`
                id,
                table_id,
                created_at,
                order_items (
                    id,
                    menu_item_id,
                    name,
                    quantity,
                    price,
                    status,
                    created_at,
                    menu_items (
                        category
                    )
                )
            `)
            .eq('status', 'active')
            .order('created_at', { ascending: true });

        if (error) {
            console.error("Error fetching orders:", error);
            return;
        }

        if (activeOrders) {
            const displayOrders: DisplayOrder[] = activeOrders.map((o: any) => {
                // Filter items for Bar
                const rawItems = (o.order_items || []).filter((i: any) => {
                    const category = i.category || i.menu_items?.category;
                    return category && BAR_CATEGORIES.includes(category as MenuCategory);
                });

                // Group items by menuItemId and status
                const groupedItemsMap: Record<string, OrderItem> = {};
                
                rawItems.forEach((i: any) => {
                    const category = i.category || i.menu_items?.category;
                    const status = i.status || 'pending';
                    const key = `${i.menu_item_id}-${status}`;
                    
                    const existing = groupedItemsMap[key];
                    if (existing) {
                        existing.quantity += i.quantity;
                        if (i.id && existing.id) {
                            const ids = existing.id.split(',');
                            if (!ids.includes(i.id)) {
                                existing.id = [...ids, i.id].join(',');
                            }
                        }
                    } else {
                        groupedItemsMap[key] = {
                            id: i.id,
                            menuItemId: i.menu_item_id,
                            quantity: i.quantity,
                            name: i.name,
                            price: i.price,
                            status: status,
                            category: category,
                            created_at: i.created_at
                        };
                    }
                });

                const barItems = Object.values(groupedItemsMap);

                return {
                    orderId: o.id,
                    tableId: o.table_id,
                    items: barItems,
                    timestamp: new Date(o.created_at).getTime()
                };
            }).filter(o => o.items.length > 0); // Only keep orders with bar items

            setOrders(displayOrders);
            if (displayOrders.length > 0 && !selectedOrderId) {
                setSelectedOrderId(displayOrders[0]?.orderId);
            }
        }
    };

    const handleItemStatus = async (itemId: string, currentStatus: string) => {
        const newStatus = currentStatus === 'pending' ? 'served' : 'pending';
        const ids = itemId.split(',');
        
        try {
            await supabase
                .from('order_items')
                .update({ status: newStatus })
                .in('id', ids);
                
            // Optimistic update
            setOrders(prev => prev.map(o => ({
                ...o,
                items: o.items.map(i => i.id === itemId ? { ...i, status: newStatus } : i)
            })));
        } catch (e) {
            console.error("Error updating status:", e);
        }
    };

    const handleOrderComplete = async (orderId: string, items: OrderItem[]) => {
         // Mark all items in this order (that are displayed here) as served
         try {
             const allIds: string[] = [];
             items.forEach(item => {
                 if (item.id) {
                     allIds.push(...item.id.split(','));
                 }
             });

             await supabase
                 .from('order_items')
                 .update({ status: 'served' })
                 .in('id', allIds);
             
             // Optimistic
             setOrders(prev => prev.map(o => {
                 if (o.orderId === orderId) {
                     return {
                         ...o,
                         items: o.items.map(i => ({ ...i, status: 'served' }))
                     };
                 }
                 return o;
             }));
         } catch (e) {
             console.error("Error completing items:", e);
         }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-50">
                <Loader2 className="w-8 h-8 animate-spin text-[--primary]" />
            </div>
        );
    }

    const selectedOrder = orders.find(o => o.orderId === selectedOrderId) || (orders.length > 0 ? orders[0] : null);

    return (
        <div className="flex flex-col h-screen bg-gray-50 pb-20 md:pb-0">
            <Navbar 
                title="Gestione Bar"
                icon={<Wine className="w-6 h-6 sm:w-8 sm:h-8" />}
            />

            <div className="flex-1 flex overflow-hidden mt-16 sm:mt-20">
                {/* Sidebar: Elenco Comande */}
                <SidebarContainer className="w-full md:w-80 border-r md:border-gray-200 flex flex-col shadow-lg shrink-0 z-20 bg-white">
                    <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                        <h2 className="font-bold text-gray-800 text-lg">Ordini Bar</h2>
                        <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-bold">
                            {orders.length}
                        </span>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        {orders.length === 0 ? (
                            <div className="p-8 text-center text-gray-400">
                                <CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                <p>Nessun ordine</p>
                            </div>
                        ) : (
                            orders.map(order => {
                                const allServed = order.items.every(i => i.status === 'served');
                                const timeDiff = Math.floor((Date.now() - order.timestamp) / 60000);
                                const isSelected = selectedOrderId === order.orderId;
                                
                                return (
                                    <SidebarItem
                                        key={order.orderId}
                                        active={isSelected}
                                        onClick={() => {
                                            setSelectedOrderId(order.orderId);
                                            setIsMobileDetailOpen(true);
                                        }}
                                        label={tableMap[order.tableId] || `Tavolo ${order.tableId.replace('el-', '').replace('rect-', '')}`}
                                        color={allServed ? 'green' : 'blue'}
                                        rightElement={
                                            <div className="flex items-center gap-2">
                                                <div className="flex items-center gap-1 text-[10px] text-gray-400">
                                                    <Clock className="w-3 h-3" />
                                                    {timeDiff}m
                                                </div>
                                            </div>
                                        }
                                    />
                                );
                            })
                        )}
                    </div>
                </SidebarContainer>

                {/* Main Content: Dettaglio Ordine Selezionato (Desktop) */}
                <div className="hidden md:flex flex-col flex-1 overflow-y-auto p-8 bg-gray-100 items-center">
                    {selectedOrder ? (
                        <div className="w-full max-w-3xl">
                            <div className="bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden">
                                <div className="p-6 border-b border-gray-100 bg-white flex justify-between items-center">
                                    <div>
                                        <h2 className="text-3xl font-black text-gray-800">
                                            {tableMap[selectedOrder.tableId] || `Tavolo ${selectedOrder.tableId.replace('el-', '').replace('rect-', '')}`}
                                        </h2>
                                        <div className="flex items-center gap-2 mt-1 text-gray-500 font-medium">
                                            <Clock className="w-4 h-4" />
                                            Ricevuto {Math.floor((Date.now() - selectedOrder.timestamp) / 60000)} minuti fa
                                        </div>
                                    </div>
                                    
                                    {selectedOrder.items.some(i => i.status !== 'served') && (
                                        <Bottone 
                                            onClick={() => handleOrderComplete(selectedOrder.orderId, selectedOrder.items)}
                                            variante="secondario"
                                        >
                                            Completa Tutto
                                        </Bottone>
                                    )}
                                </div>

                                <div className="p-6 space-y-4">
                                    {selectedOrder.items.map(item => {
                                        const itemTime = item.created_at ? new Date(item.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '';
                                        return (
                                            <div 
                                                key={item.id} 
                                                onClick={() => handleItemStatus(item.id!, item.status!)}
                                                className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex justify-between items-center ${
                                                    item.status === 'served' 
                                                    ? 'bg-gray-50 border-gray-100 text-gray-400 opacity-60' 
                                                    : 'bg-white border-gray-200 hover:border-blue-300 shadow-sm'
                                                }`}
                                            >
                                                <div className="flex items-center gap-6">
                                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-xl ${
                                                        item.status === 'served' ? 'bg-gray-200 text-gray-500' : 'bg-blue-100 text-blue-700'
                                                    }`}>
                                                        {item.quantity}
                                                    </div>
                                                    <div>
                                                        <h4 className={`text-xl font-bold ${item.status === 'served' ? 'line-through' : 'text-gray-800'}`}>
                                                            {item.name}
                                                        </h4>
                                                        <div className="flex items-center gap-3 mt-1">
                                                            <span className="text-xs font-bold uppercase tracking-wider text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                                                                {item.category}
                                                            </span>
                                                            {itemTime && (
                                                                <span className="text-xs text-gray-400 flex items-center gap-1">
                                                                    <Clock className="w-3 h-3" />
                                                                    {itemTime}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                {item.status === 'served' ? (
                                                    <CheckCircle className="w-8 h-8 text-green-500" />
                                                ) : (
                                                    <div className="w-8 h-8 rounded-full border-2 border-gray-200" />
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400">
                            <Wine className="w-20 h-20 mb-4 opacity-10" />
                            <p className="text-xl font-medium">Seleziona un ordine dalla lista</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Mobile Modal Detail */}
            {isMobileDetailOpen && selectedOrder && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center md:hidden pb-24">
                    <div className="absolute inset-0 bg-black/40" onClick={() => setIsMobileDetailOpen(false)}></div>
                    <div className="bg-white rounded-2xl w-[92%] max-w-md shadow-2xl overflow-hidden relative flex flex-col max-h-[80vh]">
                        <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-blue-50">
                            <div>
                                <h3 className="font-bold text-xl text-gray-800">
                                    {tableMap[selectedOrder.tableId] || `Tavolo ${selectedOrder.tableId.replace('el-', '').replace('rect-', '')}`}
                                </h3>
                                <p className="text-xs text-gray-500">
                                    {selectedOrder.items.length} articoli
                                </p>
                            </div>
                            <button onClick={() => setIsMobileDetailOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {selectedOrder.items.map(item => (
                                <div 
                                    key={item.id} 
                                    onClick={() => handleItemStatus(item.id!, item.status!)}
                                    className={`p-3 rounded-xl border-2 transition-all flex justify-between items-center ${
                                        item.status === 'served' 
                                        ? 'bg-gray-50 border-gray-100 text-gray-400 opacity-60' 
                                        : 'bg-white border-gray-200 shadow-sm'
                                    }`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                                            item.status === 'served' ? 'bg-gray-200' : 'bg-blue-100 text-blue-700'
                                        }`}>
                                            {item.quantity}
                                        </div>
                                        <div>
                                            <h4 className={`font-bold ${item.status === 'served' ? 'line-through' : 'text-gray-800'}`}>
                                                {item.name}
                                            </h4>
                                            <span className="text-[10px] font-bold uppercase text-gray-400">
                                                {item.category}
                                            </span>
                                        </div>
                                    </div>
                                    {item.status === 'served' && <CheckCircle className="w-6 h-6 text-green-500" />}
                                </div>
                            ))}
                        </div>

                        <div className="p-4 bg-gray-50 border-t">
                            <Bottone 
                                onClick={() => {
                                    handleOrderComplete(selectedOrder.orderId, selectedOrder.items);
                                    setIsMobileDetailOpen(false);
                                }}
                                variante="secondario"
                                pienaLarghezza
                            >
                                Completa Tutto
                            </Bottone>
                        </div>
                    </div>
                </div>
            )}

            <MobileStickyBar
                activeKey="bar"
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
