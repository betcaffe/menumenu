import { useState, useEffect } from 'react';
import { ChefHat, Plus, Edit2, Trash2, X, Menu as MenuIcon, PenTool, LayoutGrid } from 'lucide-react';
import Bottone from '../../componenti/Bottone';
import Navbar from '../../componenti/Navbar';
import MobileStickyBar from '../../componenti/MobileStickyBar';
import Input from '../../componenti/Input';
import Textarea from '../../componenti/Textarea';
import Select from '../../componenti/Select';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../supabaseClient';
import { MenuItem, MenuCategory, CATEGORIES } from './types';
import { Sidebar as SidebarContainer, SidebarItem } from '../../componenti/Sidebar';

export default function GestioneMenu() {
  const { user } = useAuth();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<MenuCategory>('Antipasti');
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [modalCategory, setModalCategory] = useState<MenuCategory | null>(null);

  // Load menu from Supabase on mount
  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
        // 1. Get Restaurant ID
        const { data: restaurant, error: _error } = await supabase
            .from('restaurants')
            .select('id')
            .eq('user_id', user.id)
            .single();
            
        if (restaurant) {
            setRestaurantId(restaurant.id);
            
            // 2. Get Menu Items
            const { data: items, error: _menuError } = await supabase
                .from('menu_items')
                .select('*')
                .eq('restaurant_id', restaurant.id);
                
            if (items) {
                setMenuItems(items);
            }
        }
    };
    
    loadData();
  }, [user]);

  const handleAddItem = () => {
    setEditingItem({
      id: `item-${Date.now()}`,
      name: '',
      price: 0,
      category: activeCategory,
      available: true,
      description: ''
    });
    setIsModalOpen(true);
  };

  const handleEditItem = (item: MenuItem) => {
    setEditingItem({ ...item });
    setIsModalOpen(true);
  };

  const handleDeleteItem = async (id: string) => {
    if (confirm('Sei sicuro di voler eliminare questo piatto?')) {
      // Optimistic update
      const previousItems = [...menuItems];
      setMenuItems(prev => prev.filter(item => item.id !== id));

      if (!id.startsWith('item-')) { // Only delete from DB if it's not a temp ID
          const { error } = await supabase
            .from('menu_items')
            .delete()
            .eq('id', id);
            
          if (error) {
              console.error('Error deleting item:', error);
              alert('Errore durante l\'eliminazione');
              setMenuItems(previousItems); // Rollback
          }
      }
    }
  };

  const handleSaveItem = async () => {
    if (!user) return;
    if (!editingItem || !editingItem.name) return;

    let currentRestaurantId = restaurantId;

    // Ensure restaurant exists
    if (!currentRestaurantId) {
        // Create restaurant
        const { data: newRest, error: createError } = await supabase
            .from('restaurants')
            .insert([{ user_id: user.id, name: 'Il mio Ristorante' }])
            .select()
            .single();
            
        if (createError) {
            console.error('Error creating restaurant:', createError);
            alert('Errore nella creazione del ristorante. Riprova.');
            return;
        }
        currentRestaurantId = newRest.id;
        setRestaurantId(newRest.id);
    }

    const itemData = {
        user_id: user.id,
        restaurant_id: currentRestaurantId,
        name: editingItem.name,
        description: editingItem.description,
        price: editingItem.price,
        category: editingItem.category,
        available: editingItem.available,
        // image_url: editingItem.image_url 
    };

    try {
        if (editingItem.id && !editingItem.id.startsWith('item-')) {
            // Update
            const { error, data } = await supabase
                .from('menu_items')
                .update(itemData)
                .eq('id', editingItem.id)
                .select()
                .single();
                
            if (error) throw error;
            
            if (data) {
                setMenuItems(prev => prev.map(i => i.id === data.id ? data : i));
            }
        } else {
            // Insert
            const { error, data } = await supabase
                .from('menu_items')
                .insert([itemData])
                .select()
                .single();
                
            if (error) throw error;

            if (data) {
                setMenuItems(prev => {
                     return [...prev, data];
                });
            }
        }
        
        setIsModalOpen(false);
        setEditingItem(null);
    } catch (e) {
        console.error('Error saving item:', e);
        alert('Errore nel salvataggio del piatto');
    }
  };

  const filteredItems = menuItems.filter(item => item.category === activeCategory);

  return (
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
      <Navbar 
        title="Gestione Menu"
        icon={<ChefHat className="w-6 h-6 sm:w-8 sm:h-8" />}
      />

      <div className="flex-1 flex overflow-hidden mt-16 sm:mt-20">
        <SidebarContainer className="w-full md:w-64 flex-shrink-0 border-r md:border-gray-200 z-10 bg-white">
            <div className="p-4 bg-orange-50 border-b border-orange-100">
                <h2 className="font-bold text-gray-800 flex items-center gap-2">
                    <MenuIcon className="w-5 h-5 text-[--primary]" />
                    Categorie
                </h2>
            </div>
            <div className="flex-1 overflow-y-auto">
                {CATEGORIES.map(category => (
                    <SidebarItem 
                        key={category}
                        label={category}
                        active={activeCategory === category}
                        onClick={() => {
                          setActiveCategory(category);
                          if (window.matchMedia('(max-width: 767px)').matches) {
                            setModalCategory(category);
                            setIsCategoryModalOpen(true);
                          }
                        }}
                        rightElement={
                            <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full">
                                {menuItems.filter(i => i.category === category).length}
                            </span>
                        }
                    />
                ))}
            </div>
        </SidebarContainer>

        {/* Content Area (desktop) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 w-full relative">
            <div className="hidden md:block max-w-4xl mx-auto">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">{activeCategory}</h2>
                    <span className="text-gray-500 text-sm">
                        {filteredItems.length} piatti
                    </span>
                </div>

                {filteredItems.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                            <ChefHat className="w-8 h-8 text-gray-300" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-1">Nessun piatto in questa categoria</h3>
                        <p className="text-gray-500 mb-6 max-w-sm">Inizia ad aggiungere i tuoi piatti per creare il menu perfetto per i tuoi clienti.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {filteredItems.map(item => (
                            <div key={item.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between group hover:border-[--primary] transition-all hover:shadow-md">
                                <div className="flex-1 min-w-0 flex items-center gap-4 pr-4">
                                    <div className="w-[30%] min-w-[150px] max-w-[250px]">
                                        <h3 className="font-bold text-gray-800 truncate" title={item.name}>{item.name}</h3>
                                        {!item.available && (
                                            <span className="text-xs font-medium bg-red-100 text-red-800 px-2 py-0.5 rounded-full inline-block mt-1">
                                                Non disponibile
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-gray-500 text-sm truncate" title={item.description || "Nessuna descrizione"}>
                                            {item.description || "Nessuna descrizione"}
                                        </p>
                                    </div>
                                    <div className="w-[80px] text-right flex-shrink-0">
                                        <span className="text-sm font-bold text-[--primary] bg-orange-50 px-2 py-1 rounded-md whitespace-nowrap">
                                            € {item.price.toFixed(2)}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 border-l border-gray-100 pl-4">
                                    <button 
                                        onClick={() => handleEditItem(item)}
                                        className="p-2 text-gray-400 hover:text-[--secondary] hover:bg-blue-50 rounded-lg transition-colors"
                                        title="Modifica"
                                    >
                                        <Edit2 className="w-5 h-5" />
                                    </button>
                                    <button 
                                        onClick={() => handleDeleteItem(item.id)}
                                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Elimina"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Floating Add Button */}
            <button 
                onClick={handleAddItem}
                className="fixed bottom-24 right-6 w-14 h-14 bg-[--primary] text-white rounded-full shadow-lg flex items-center justify-center hover:bg-[--secondary] transition-colors z-50 md:bottom-6"
            >
                <Plus className="w-8 h-8" />
            </button>
        </div>
      </div>

      {isCategoryModalOpen && modalCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
              <h3 className="font-bold text-lg">{modalCategory}</h3>
              <button onClick={() => setIsCategoryModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 gap-3">
                {menuItems.filter(i => i.category === modalCategory).map(item => (
                  <div key={item.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-gray-800 truncate" title={item.name}>{item.name}</h3>
                      <span className="text-sm font-bold text-[--primary] bg-orange-50 px-2 py-1 rounded-md whitespace-nowrap">
                        € {item.price.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-gray-500 text-sm truncate mr-4" title={item.description || 'Nessuna descrizione'}>
                        {item.description || 'Nessuna descrizione'}
                      </p>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => {
                            handleEditItem(item);
                            setIsCategoryModalOpen(false);
                          }}
                          className="px-3 py-1.5 text-[--secondary] hover:bg-blue-50 rounded-md transition-colors text-sm font-medium"
                          title="Modifica"
                        >
                          Modifica
                        </button>
                        <button 
                          onClick={() => handleDeleteItem(item.id)}
                          className="px-3 py-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors text-sm font-medium"
                          title="Elimina"
                        >
                          Elimina
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {menuItems.filter(i => i.category === modalCategory).length === 0 && (
                  <div className="text-center text-gray-400 py-12">Nessun piatto in questa categoria</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit/Add Modal */}
      {isModalOpen && editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
                    <h3 className="font-bold text-lg">
                        {menuItems.find(i => i.id === editingItem.id) ? 'Modifica Piatto' : 'Nuovo Piatto'}
                    </h3>
                    <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                        <X className="w-6 h-6" />
                    </button>
                </div>
                
                <div className="p-6 space-y-4">
                    <Input 
                        label="Nome Piatto"
                        type="text" 
                        value={editingItem.name}
                        onChange={e => setEditingItem({...editingItem, name: e.target.value})}
                        placeholder="Es. Spaghetti Carbonara"
                        autoFocus
                    />
                    
                    <div className="grid grid-cols-2 gap-4">
                        <Input 
                            label="Prezzo (€)"
                            type="number" 
                            step="0.50"
                            value={editingItem.price}
                            onChange={e => setEditingItem({...editingItem, price: parseFloat(e.target.value) || 0})}
                        />
                        <Select 
                            label="Categoria"
                            value={editingItem.category}
                            onChange={e => setEditingItem({...editingItem, category: e.target.value as MenuCategory})}
                        >
                            {CATEGORIES.map(c => (
                                <option key={c} value={c}>{c}</option>
                            ))}
                        </Select>
                    </div>

                    <Textarea 
                        label="Descrizione"
                        value={editingItem.description || ''}
                        onChange={e => setEditingItem({...editingItem, description: e.target.value})}
                        placeholder="Ingredienti e dettagli..."
                        rows={3}
                    />

                    <div className="flex items-center gap-2 pt-2">
                        <input 
                            type="checkbox" 
                            id="available"
                            checked={editingItem.available}
                            onChange={e => setEditingItem({...editingItem, available: e.target.checked})}
                            className="w-4 h-4 text-[--primary] rounded focus:ring-[--primary]"
                        />
                        <label htmlFor="available" className="text-sm font-medium text-gray-700 select-none cursor-pointer">
                            Disponibile per l'ordine
                        </label>
                    </div>

                    <div className="pt-4 flex gap-3">
                        <Bottone 
                            variante="secondario" 
                            className="flex-1 justify-center"
                            onClick={() => setIsModalOpen(false)}
                        >
                            Annulla
                        </Bottone>
                        <Bottone 
                            variante="primario" 
                            className="flex-1 justify-center"
                            onClick={handleSaveItem}
                        >
                            Salva
                        </Bottone>
                    </div>
                </div>
            </div>
        </div>
      )}

      <MobileStickyBar
        activeKey="menu"
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
