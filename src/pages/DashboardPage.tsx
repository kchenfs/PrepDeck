// src/pages/DashboardPage.tsx
import { useState } from 'react';
import { KanbanColumn } from '../components/dashboard/KanbanColumn';
import type { Order } from '../types'; // FIX: 'type' added for verbatimModuleSyntax
import { Inbox, ChefHat, LayoutDashboard, History } from 'lucide-react';
import { Link } from 'react-router-dom';

// Mock data for demonstration
const initialOrders: Order[] = [
  { id: 1, displayId: "AB12", service: 'UberEats', time: '4:15 PM', items: [{ name: '经典汉堡', quantity: 2 }], state: 'queue', isUrgent: true },
  { id: 2, displayId: "CD34", service: 'DoorDash', time: '4:12 PM', items: [{ name: '炸薯条', quantity: 1 }], state: 'preparing', isUrgent: false },
];

export function DashboardPage() {
  const [orders, setOrders] = useState<Order[]>(initialOrders);

  const handleStartPreparing = (id: number) => {
    setOrders(prevOrders => prevOrders.map(o => o.id === id ? { ...o, state: 'preparing' } : o));
  };

  const handleDone = (id: number) => {
    setOrders(prevOrders => prevOrders.filter(o => o.id !== id));
    // Here you would also move the order to a 'pastOrders' state for the history page.
  };

  const queueOrders = orders.filter(o => o.state === 'queue');
  const preparingOrders = orders.filter(o => o.state === 'preparing');

  return (
    <div className="p-4 lg:p-6 bg-gray-900 min-h-screen text-gray-100">
      <header className="flex flex-col sm:flex-row justify-between items-center pb-6 border-b border-gray-700 mb-6">
        <div className="flex items-center gap-3 mb-4 sm:mb-0">
            <LayoutDashboard className="w-8 h-8 text-indigo-400" />
            <h1 className="text-3xl font-bold text-white">BOH Dashboard</h1>
        </div>
        <div className="flex flex-wrap items-center gap-4">
             <Link to="/history" className="flex items-center gap-2 text-sm font-medium text-gray-300 hover:text-white transition-colors">
                <History className="w-5 h-5" />
                Order History
            </Link>
        </div>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <KanbanColumn 
          title="Order Queue" 
          icon={<Inbox className="w-6 h-6 text-blue-400" />} 
          orders={queueOrders}
          onStartPreparing={handleStartPreparing}
          onDone={handleDone}
        />
        <KanbanColumn 
          title="Preparing" 
          icon={<ChefHat className="w-6 h-6 text-yellow-400" />} 
          orders={preparingOrders}
          onStartPreparing={handleStartPreparing}
          onDone={handleDone}
        />
      </main>
    </div>
  );
}