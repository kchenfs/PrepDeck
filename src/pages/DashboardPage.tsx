// src/pages/DashboardPage.tsx
import { useState, useEffect } from 'react';
import { KanbanColumn } from '../components/dashboard/KanbanColumn';
import type { Order } from '../types';
import { Inbox, ChefHat, LayoutDashboard, History } from 'lucide-react';
import { Link } from 'react-router-dom';
import { API, graphqlOperation } from 'aws-amplify';

// THIS IS THE FIX: The subscription now requests the 'order' field,
// which contains the JSON string of the order data.
const onNewOrderSubscription = /* GraphQL */ `
  subscription OnNewOrder {
    onNewOrder {
      order
    }
  }
`;

// Helper type for the subscription data
type NewOrderSubscription = {
  value: {
    data: {
      onNewOrder: {
        order: string; // The data from the subscription is a JSON string
      };
    };
  };
};

export function DashboardPage() {
  const [orders, setOrders] = useState<Order[]>([]);

  // This useEffect hook sets up the real-time subscription when the component mounts.
  useEffect(() => {
    console.log("Setting up AppSync subscription...");

    const subscription = (API.graphql(
      graphqlOperation(onNewOrderSubscription)
    ) as any).subscribe({
      next: ({ value }: NewOrderSubscription) => {
        try {
            console.log("Received new order data string:", value.data.onNewOrder.order);
            
            // The 'order' data from the mutation is a JSON string, so we need to parse it.
            const newOrderData = JSON.parse(value.data.onNewOrder.order);
            
            // Transform the incoming data to match our frontend Order type
            const newOrder: Order = {
                id: newOrderData.OrderID,
                displayId: newOrderData.DisplayID,
                service: 'UberEats', // Assuming UberEats for now
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), // Use current time, formatted
                items: newOrderData.Items.map((item: any) => ({
                    name: item.Title,
                    quantity: item.Quantity
                })),
                state: 'queue', // New orders always start in the queue
                isUrgent: false, // You can add logic for this later
            };

            setOrders((prevOrders) => [...prevOrders, newOrder]);
        } catch (error) {
            console.error("Error processing subscription message:", error);
        }
      },
      error: (error: any) => console.warn(error)
    });

    // This cleanup function will run when the component unmounts.
    return () => {
      console.log("Tearing down AppSync subscription.");
      subscription.unsubscribe();
    };
  }, []); // The empty dependency array means this effect runs only once.


  const handleStartPreparing = (id: string) => {
    setOrders(prevOrders => prevOrders.map(o => o.id === id ? { ...o, state: 'preparing' } : o));
  };

  const handleDone = (id: string) => {
    setOrders(prevOrders => prevOrders.filter(o => o.id !== id));
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

