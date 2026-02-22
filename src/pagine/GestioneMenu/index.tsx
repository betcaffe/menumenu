import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ChefHat, Plus, Edit2, Trash2, Save, X } from 'lucide-react';
import Bottone from '../../componenti/Bottone';
import { MenuItem, MenuCategory, CATEGORIES, INITIAL_MENU } from './types';

export default function GestioneMenu() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<MenuCategory>('Antipasti');

  // Load menu from local storage on mount
  useEffect(() => {
    const savedMenu = localStorage.getItem('menu.data');
    if (savedMenu) {
      try {
        setMenuItems(JSON.parse(savedMenu));
      } catch (e) {
        console.error("Failed to load menu", e);
        setMenuItems(INITIAL_MENU);
      }
    } else {
      setMenuItems(INITIAL_MENU);
    }
  }, []);

  // Save menu whenever it changes
  useEffect(() => {
    if (menuItems.length > 0) {
      localStorage.setItem('menu.data', JSON.stringify(menuItems));
    }
  }, [menuItems]);

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

  const handleDeleteItem = (id: string) => {
    if (confirm('Sei sicuro di voler eliminare questo piatto?')) {
      setMenuItems(prev => prev.filter(item => item.id !== id));
    }
  };

  const handleSaveItem = () => {
    if (!editingItem || !editingItem.name) return;

    setMenuItems(prev => {
      const existingIndex = prev.findIndex(i => i.id === editingItem.id);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = editingItem;
        return updated;
      } else {
        return [...prev, editingItem];
      }
    });
    setIsModalOpen(false);
    setEditingItem(null);
  };

  const filteredItems = menuItems.filter(item => item.category === activeCategory);

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 p-4 flex items-center justify-between shadow-sm z-10">
        <div className="flex items-center gap-4">
            <Link to="/" className="text-gray-500 hover:text-[--secondary] p-1">
                <ArrowLeft className="w-6 h-6" />
            </Link>
            <h1 className="text-xl font-bold text-[--secondary] flex items-center gap-2">
                <ChefHat className="w-6 h-6 text-[--primary]" />
                Gestione Menu
            </h1>
        </div>
        <Bottone onClick={handleAddItem} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Aggiungi Piatto</span>
        </Bottone>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Categories */}
        <div className="w-[20%] min-w-[220px] bg-white border-r border-gray-200 overflow-y-auto hidden md:block">
            <div className="p-4">
                <h2 className="font-semibold text-gray-500 mb-4 text-sm uppercase tracking-wider">Categorie</h2>
                <nav className="space-y-1">
                    {CATEGORIES.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setActiveCategory(cat)}
                            className={`w-full text-left px-4 py-3 rounded-lg transition-colors flex items-center justify-between ${
                                activeCategory === cat 
                                ? 'bg-[--primary] text-white font-medium shadow-md' 
                                : 'text-gray-600 hover:bg-gray-100'
                            }`}
                        >
                            {cat}
                            <span className={`text-xs px-2 py-0.5 rounded-full ${activeCategory === cat ? 'bg-white/20' : 'bg-gray-200'}`}>
                                {menuItems.filter(i => i.category === cat).length}
                            </span>
                        </button>
                    ))}
                </nav>
            </div>
        </div>

        {/* Mobile Category Select */}
        <div className="md:hidden p-4 bg-white border-b border-gray-200">
            <select 
                value={activeCategory} 
                onChange={(e) => setActiveCategory(e.target.value as MenuCategory)}
                className="w-full p-2 border border-gray-300 rounded-lg"
            >
                {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                ))}
            </select>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-auto p-4 sm:p-8">
            <div className="max-w-4xl mx-auto">
                <h2 className="text-2xl font-bold mb-6 text-gray-800">{activeCategory}</h2>
                
                {filteredItems.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
                        <p className="text-gray-500 mb-4">Nessun piatto in questa categoria</p>
                        <Bottone variante="secondario" onClick={handleAddItem}>Aggiungi il primo piatto</Bottone>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {filteredItems.map(item => (
                            <div key={item.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between group hover:border-[--primary] transition-colors">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3">
                                        <h3 className="font-bold text-lg text-gray-800">{item.name}</h3>
                                        <span className="text-sm font-medium bg-green-100 text-green-800 px-2 py-0.5 rounded">
                                            € {item.price.toFixed(2)}
                                        </span>
                                        {!item.available && (
                                            <span className="text-xs font-medium bg-red-100 text-red-800 px-2 py-0.5 rounded">
                                                Non disponibile
                                            </span>
                                        )}
                                    </div>
                                    {item.description && (
                                        <p className="text-gray-500 text-sm mt-1">{item.description}</p>
                                    )}
                                </div>
                                <div className="flex items-center gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button 
                                        onClick={() => handleEditItem(item)}
                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                                        title="Modifica"
                                    >
                                        <Edit2 className="w-5 h-5" />
                                    </button>
                                    <button 
                                        onClick={() => handleDeleteItem(item.id)}
                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
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
        </div>
      </div>

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
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nome Piatto</label>
                        <input 
                            type="text" 
                            value={editingItem.name}
                            onChange={e => setEditingItem({...editingItem, name: e.target.value})}
                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[--primary] focus:border-transparent outline-none"
                            placeholder="Es. Spaghetti Carbonara"
                            autoFocus
                        />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Prezzo (€)</label>
                            <input 
                                type="number" 
                                step="0.50"
                                value={editingItem.price}
                                onChange={e => setEditingItem({...editingItem, price: parseFloat(e.target.value) || 0})}
                                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[--primary] focus:border-transparent outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                            <select 
                                value={editingItem.category}
                                onChange={e => setEditingItem({...editingItem, category: e.target.value as MenuCategory})}
                                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[--primary] focus:border-transparent outline-none"
                            >
                                {CATEGORIES.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Descrizione (Opzionale)</label>
                        <textarea 
                            value={editingItem.description || ''}
                            onChange={e => setEditingItem({...editingItem, description: e.target.value})}
                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[--primary] focus:border-transparent outline-none h-24 resize-none"
                            placeholder="Ingredienti, allergeni, note..."
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <input 
                            type="checkbox" 
                            id="available"
                            checked={editingItem.available}
                            onChange={e => setEditingItem({...editingItem, available: e.target.checked})}
                            className="w-4 h-4 text-[--primary] rounded border-gray-300 focus:ring-[--primary]"
                        />
                        <label htmlFor="available" className="text-sm text-gray-700">Disponibile per gli ordini</label>
                    </div>
                </div>

                <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
                    <Bottone variante="fantasma" onClick={() => setIsModalOpen(false)}>Annulla</Bottone>
                    <Bottone onClick={handleSaveItem}>Salva Piatto</Bottone>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}