import { useState, useEffect } from 'react';
import { CheckCircle, Clock, Loader2, Wine, ClipboardList, Utensils } from 'lucide-react';
import Navbar from '../../componenti/Navbar';
import Bottone from '../../componenti/Bottone';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../supabaseClient';
import { OrderItem, MenuCategory } from '../GestioneMenu/types';
import MobileStickyBar from '../../componenti/MobileStickyBar';

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
                const barItems = (o.order_items || []).filter((i: any) => {
                    const category = i.category || i.menu_items?.category;
                    return category && BAR_CATEGORIES.includes(category as MenuCategory);
                }).map((i: any) => ({
                    id: i.id,
                    menuItemId: i.menu_item_id,
                    quantity: i.quantity,
                    name: i.name,
                    price: i.price,
                    status: i.status || 'pending',
                    category: i.category || i.menu_items?.category,
                    created_at: i.created_at
                }));

                return {
                    orderId: o.id,
                    tableId: o.table_id,
                    items: barItems,
                    timestamp: new Date(o.created_at).getTime()
                };
            }).filter(o => o.items.length > 0); // Only keep orders with bar items

            setOrders(displayOrders);
        }
    };

    const handleItemStatus = async (itemId: string, currentStatus: string) => {
        const newStatus = currentStatus === 'pending' ? 'served' : 'pending';
        
        try {
            await supabase
                .from('order_items')
                .update({ status: newStatus })
                .eq('id', itemId);
                
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
             const itemIds = items.map(i => i.id);
             await supabase
                 .from('order_items')
                 .update({ status: 'served' })
                 .in('id', itemIds);
             
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

    return (
        <div className="flex flex-col h-screen bg-gray-50 pb-20 md:pb-0">
            <Navbar 
                title="Gestione Bar"
                icon={<Wine className="w-6 h-6 sm:w-8 sm:h-8" />}
            />

            <div className="flex-1 overflow-y-auto p-4 pt-20 sm:pt-24">
                {orders.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400">
                        <CheckCircle className="w-16 h-16 mb-4 opacity-20" />
                        <p className="text-lg">Nessun ordine in attesa</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {orders.map(order => {
                            const allServed = order.items.every(i => i.status === 'served');
                            const timeDiff = Math.floor((Date.now() - order.timestamp) / 60000); // minutes
                            
                            return (
                                <div 
                                    key={order.orderId} 
                                    className={`bg-white rounded-xl shadow-sm border-2 overflow-hidden flex flex-col ${
                                        allServed ? 'border-green-100 opacity-60' : 'border-blue-100'
                                    }`}
                                >
                                    <div className={`p-3 border-b flex justify-between items-center ${
                                        allServed ? 'bg-green-50' : 'bg-blue-50'
                                    }`}>
                                        <div className="font-bold text-lg text-gray-800">
                                            {tableMap[order.tableId] || `Tavolo ${order.tableId.replace('el-', '').replace('rect-', '')}`}
                                        </div>
                                        <div className="flex items-center gap-1 text-xs font-medium text-gray-500">
                                            <Clock className="w-3 h-3" />
                                            {timeDiff}m
                                        </div>
                                    </div>
                                    
                                    <div className="p-3 flex-1 flex flex-col gap-2">
                                        {order.items.map(item => {
                                            const itemTime = item.created_at ? new Date(item.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '';
                                            return (
                                            <div 
                                                key={item.id} 
                                                onClick={() => handleItemStatus(item.id!, item.status!)}
                                                className={`p-3 rounded-lg border cursor-pointer transition-all flex justify-between items-center ${
                                                    item.status === 'served' 
                                                    ? 'bg-gray-50 border-gray-100 text-gray-400 line-through' 
                                                    : 'bg-white border-gray-200 hover:border-blue-300 shadow-sm'
                                                }`}
                                            >
                                                <div className="flex flex-col gap-1 w-full">
                                                    <div className="flex items-center gap-3">
                                                        <span className="font-bold text-lg w-6 h-6 flex items-center justify-center bg-gray-100 rounded-full text-gray-700">
                                                            {item.quantity}
                                                        </span>
                                                        <span className="font-medium">{item.name}</span>
                                                    </div>
                                                    {itemTime && (
                                                        <div className="text-xs text-gray-400 ml-9 flex items-center gap-1">
                                                            <Clock className="w-3 h-3" />
                                                            {itemTime}
                                                        </div>
                                                    )}
                                                </div>
                                                {item.status === 'served' && <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />}
                                            </div>
                                        )})}
                                    </div>
                                    
                                    {!allServed && (
                                        <div className="p-3 bg-gray-50 border-t">
                                            <Bottone 
                                                onClick={() => handleOrderComplete(order.orderId, order.items)}
                                                variante="secondario"
                                                pienaLarghezza
                                            >
                                                Completa Tutto
                                            </Bottone>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
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
