// src/pages/DashboardPage.tsx
import { useState, useEffect } from 'react';
import { KanbanColumn } from '../components/dashboard/KanbanColumn';
import type { Order } from '../types';
import { Inbox, ChefHat, LayoutDashboard, History } from 'lucide-react';
import { Link } from 'react-router-dom';

// Import the new client generator and types from aws-amplify/api
import { generateClient, type GraphQLSubscription } from 'aws-amplify/api';

const onNewOrderSubscription = /* GraphQL */ `
  subscription OnNewOrder {
    onNewOrder {
      order
    }
  }
`;

// Helper type for the subscription data
type NewOrderSubscription = {
  onNewOrder: {
    order: string;
  };
};

export function DashboardPage() {
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    console.log("Setting up AppSync subscription...");

    // Create the client inside useEffect to ensure Amplify is configured
    const client = generateClient();

    const subscription = client.graphql<GraphQLSubscription<NewOrderSubscription>>({
      query: onNewOrderSubscription
    }).subscribe({
      next: ({ data }) => {
        try {
            console.log("Received new order data string:", data.onNewOrder.order);
            
            const newOrderData = JSON.parse(data.onNewOrder.order);
            
            const newOrder: Order = {
                id: newOrderData.OrderID,
                displayId: newOrderData.DisplayID,
                service: 'UberEats',
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                items: newOrderData.Items.map((item: any) => ({
                    name: item.Title,
                    quantity: item.Quantity
                })),
                state: 'queue',
                isUrgent: false,
            };

            setOrders((prevOrders) => [...prevOrders, newOrder]);
        } catch (error) {
            console.error("Error processing subscription message:", error);
        }
      },
      error: (error) => console.warn(error)
    });

    return () => {
      console.log("Tearing down AppSync subscription.");
      subscription.unsubscribe();
    };
  }, []);


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