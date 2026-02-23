export type MenuCategory = 'Antipasti' | 'Primi' | 'Secondi' | 'Contorni' | 'Dolci' | 'Bevande' | 'Vini';

export const CATEGORIES: MenuCategory[] = ['Antipasti', 'Primi', 'Secondi', 'Contorni', 'Dolci', 'Bevande', 'Vini'];

export interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  category: MenuCategory;
  available: boolean;
}

export interface OrderItem {
  id?: string; // Database ID
  menuItemId: string;
  quantity: number;
  name: string; // denormalized for easier display
  price: number; // denormalized price at time of order
  category?: MenuCategory; // Helpful for filtering
  status?: 'pending' | 'preparing' | 'ready' | 'served';
  created_at?: string;
}

export interface Order {
  id?: string; // Database ID
  tableId: string;
  items: OrderItem[];
  status: 'active' | 'completed';
  timestamp: number;
}

export const INITIAL_MENU: MenuItem[] = [
  // Antipasti
  { id: 'a1', name: 'Bruschetta Mista', price: 6.00, category: 'Antipasti', available: true, description: 'Pane tostato con pomodoro, paté di olive, funghi' },
  { id: 'a2', name: 'Tagliere Salumi', price: 12.00, category: 'Antipasti', available: true, description: 'Selezione di salumi locali con formaggi' },
  
  // Primi
  { id: 'p1', name: 'Spaghetti Carbonara', price: 10.00, category: 'Primi', available: true, description: 'Uova, guanciale, pecorino, pepe' },
  { id: 'p2', name: 'Penne all\'Arrabbiata', price: 9.00, category: 'Primi', available: true, description: 'Pomodoro, peperoncino, aglio' },
  
  // Secondi
  { id: 's1', name: 'Tagliata di Manzo', price: 18.00, category: 'Secondi', available: true, description: 'Rucola e grana' },
  { id: 's2', name: 'Filetto al Pepe Verde', price: 22.00, category: 'Secondi', available: true },
  
  // Dolci
  { id: 'd1', name: 'Tiramisù', price: 6.00, category: 'Dolci', available: true, description: 'Fatto in casa' },
  { id: 'd2', name: 'Panna Cotta', price: 5.00, category: 'Dolci', available: true, description: 'Frutti di bosco o caramello' },
  
  // Bevande
  { id: 'b1', name: 'Acqua Naturale 1L', price: 2.50, category: 'Bevande', available: true },
  { id: 'b2', name: 'Coca Cola 33cl', price: 3.00, category: 'Bevande', available: true },
  
  // Vini
  { id: 'v1', name: 'Chianti Classico', price: 18.00, category: 'Vini', available: true, description: 'Bottiglia 75cl' },
  { id: 'v2', name: 'Prosecco Valdobbiadene', price: 20.00, category: 'Vini', available: true, description: 'Bottiglia 75cl' }
];