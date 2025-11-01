// src/amplify-config.ts
import type { ResourcesConfig } from '@aws-amplify/core';

export const amplifyConfig: ResourcesConfig = {
  Auth: {
    Cognito: {
      userPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID,
      userPoolClientId: import.meta.env.VITE_COGNITO_USER_POOL_CLIENT_ID,
      
      // This is the correct structure for Amplify v6 Hosted UI
      loginWith: {
        oauth: {
          domain: import.meta.env.VITE_COGNITO_DOMAIN,
          scopes: ['email', 'openid', 'profile'],
          redirectSignIn: [
            'http://localhost:5173/',
            'https://prepdeck.momotarosushi.ca/'
          ],
          redirectSignOut: [
            'http://localhost:5173/',
            'https://prepdeck.momotarosushi.ca/'
          ],
          responseType: 'code' as const,
        }
      }
    }
  },
  API: {
    GraphQL: {
      endpoint: import.meta.env.VITE_APPSYNC_GRAPHQL_API_URL,
      region: import.meta.env.VITE_AWS_REGION,
      defaultAuthMode: 'userPool'
    }
  }
};

// Log the config to verify it's correct
console.log('🔧 Amplify Config:', {
  endpoint: import.meta.env.VITE_APPSYNC_GRAPHQL_API_URL,
  region: import.meta.env.VITE_AWS_REGION,
  userPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID?.slice(0, 15) + '...'
});  useEffect(() => {
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
        console.log("🔵 [SUBSCRIPTION] Creating subscription...");
        console.log("🔵 [SUBSCRIPTION] About to call client.graphql().subscribe()");
        
        const subscriptionObservable = client.graphql<GraphQLSubscription<NewOrderSubscription>>({
          query: onNewOrderSubscription
        });
        console.log("🔵 [SUBSCRIPTION] Subscription observable created:", subscriptionObservable);
        
        console.log("🔵 [SUBSCRIPTION] Calling subscribe()...");
        subscription = subscriptionObservable.subscribe({
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

        console.log("✅ [SUBSCRIPTION] Subscription object created successfully!");
        console.log("✅ [SUBSCRIPTION] 👂 Now listening for new orders...");
        console.log("✅ [SUBSCRIPTION] Waiting for onNewOrder events from AppSync");
      } catch (error) {
        console.error("🔴 [SUBSCRIPTION] Failed to create subscription:", error);
      }
    };

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
  }, []);