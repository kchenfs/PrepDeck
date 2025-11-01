// src/pages/DashboardPage.tsx
import { useState, useEffect } from 'react';
import { KanbanColumn } from '../components/dashboard/KanbanColumn';
import type { Order } from '../types';
import { Inbox, ChefHat, LayoutDashboard, History, Plug } from 'lucide-react';
import { Link } from 'react-router-dom';

// Import the new client generator and types from aws-amplify/api
import { generateClient, type GraphQLSubscription } from 'aws-amplify/api';

// FIXED: Query the actual fields in your Order type, not a non-existent 'order' field
const onNewOrderSubscription = /* GraphQL */ `
  subscription OnNewOrder {
    onNewOrder {
      OrderID
      DisplayID
      State
      Items
      SpecialInstructions
    }
  }
`;

// Helper type for the subscription data - matches your actual schema
type NewOrderSubscription = {
  onNewOrder: {
    OrderID: string;
    DisplayID: string;
    State: string;
    Items: string; // This is AWSJSON, so it comes as a string
    SpecialInstructions: string;
  };
};

export function DashboardPage() {
  const [orders, setOrders] = useState<Order[]>([]);

 useEffect(() => {
    console.log("🔵 [SUBSCRIPTION] Starting AppSync subscription setup...");
    console.log("🔵 [SUBSCRIPTION] Auth config:", {
      userPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID?.slice(0, 10) + '...',
      endpoint: import.meta.env.VITE_APPSYNC_GRAPHQL_API_URL
    });

    let subscription: any = null;

    // Check if user is authenticated
    const checkAuth = async () => {
      try {
        const { getCurrentUser } = await import('aws-amplify/auth');
        const user = await getCurrentUser();
        console.log("🔵 [SUBSCRIPTION] Authenticated user:", user.username);
        console.log("🔵 [SUBSCRIPTION] User ID:", user.userId);
      } catch (error) {
        console.error("🔴 [SUBSCRIPTION] ❌ NOT AUTHENTICATED!", error);
        console.error("🔴 [SUBSCRIPTION] You must be logged in to subscribe!");
        return false;
      }
      return true;
    };

    const setupSubscription = async () => {
      const isAuth = await checkAuth();
      if (!isAuth) {
        console.error("🔴 [SUBSCRIPTION] Aborting subscription setup - not authenticated");
        return;
      }

      // Create the client inside useEffect to ensure Amplify is configured
      const client = generateClient();
      console.log("🔵 [SUBSCRIPTION] GraphQL client created");

      console.log("🔵 [SUBSCRIPTION] Subscription query:", onNewOrderSubscription);
      
      try {
        subscription = client.graphql<GraphQLSubscription<NewOrderSubscription>>({
          query: onNewOrderSubscription
        }).subscribe({
          next: ({ data }) => {
            console.log("🟢 [SUBSCRIPTION] =====================================");
            console.log("🟢 [SUBSCRIPTION] 🎉 SUBSCRIPTION EVENT TRIGGERED!");
            console.log("🟢 [SUBSCRIPTION] =====================================");
            console.log("🟢 [SUBSCRIPTION] ✅ NEW ORDER RECEIVED!");
            console.log("🟢 [SUBSCRIPTION] Raw data:", JSON.stringify(data, null, 2));
            
            try {
                const orderData = data.onNewOrder;
                console.log("🟢 [SUBSCRIPTION] Order data:", orderData);
                
                // Parse the Items JSON string
                const items = JSON.parse(orderData.Items);
                console.log("🟢 [SUBSCRIPTION] Parsed items:", items);
                
                const newOrder: Order = {
                    id: orderData.OrderID,
                    displayId: orderData.DisplayID,
                    service: 'UberEats',
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    items: items.map((item: any) => ({
                        name: item.Title,
                        quantity: item.Quantity,
                        // You can also include modifiers if your Order type supports it
                        modifiers: item.Modifiers?.map((mod: any) => ({
                            name: mod.Title,
                            quantity: mod.Quantity
                        }))
                    })),
                    state: 'queue',
                    isUrgent: false,
                    specialInstructions: orderData.SpecialInstructions
                };

                console.log("🟢 [SUBSCRIPTION] Processed order:", newOrder);
                setOrders((prevOrders) => {
                    console.log("🟢 [SUBSCRIPTION] Previous orders count:", prevOrders.length);
                    console.log("🟢 [SUBSCRIPTION] Adding new order to state");
                    return [...prevOrders, newOrder];
                });
            } catch (error) {
                console.error("🔴 [SUBSCRIPTION] ❌ Error processing subscription message:", error);
                console.error("🔴 [SUBSCRIPTION] Error details:", JSON.stringify(error, null, 2));
            }
          },
          error: (error) => {
            console.error("🔴 [SUBSCRIPTION] ❌ Subscription error occurred!");
            console.error("🔴 [SUBSCRIPTION] Error:", error);
            console.error("🔴 [SUBSCRIPTION] Error details:", JSON.stringify(error, null, 2));
          }
        });

        console.log("✅ [SUBSCRIPTION] Subscription established successfully!");
        console.log("✅ [SUBSCRIPTION] 👂 Now listening for new orders...");
        console.log("✅ [SUBSCRIPTION] Waiting for onNewOrder events from AppSync");

      } catch (error) { // <-- ‼️ THIS IS THE FIX ‼️
        console.error("🔴 [SUBSCRIPTION] ❌ FAILED TO ESTABLISH subscription!");
        console.error("🔴 [SUBSCRIPTION] Error:", error);
        console.error("🔴 [SUBSCRIPTION] Error details:", JSON.stringify(error, null, 2));
      }
    }; // <-- This brace closes setupSubscription

    setupSubscription();

    return () => {
      console.log("🔴 [SUBSCRIPTION] Cleaning up subscription...");
      if (subscription) {
        console.log("🔴 [SUBSCRIPTION] Unsubscribing from AppSync");
        subscription.unsubscribe();
      } else {
        console.log("🟡 [SUBSCRIPTION] No active subscription to clean up");
      }
    };
  }, []); // <-- This brace closes useEffect


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
            <Link to="/integrations" className="flex items-center gap-2 text-sm font-medium text-gray-300 hover:text-white transition-colors">
                <Plug className="w-5 h-5" />
                Integrations
            </Link>
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