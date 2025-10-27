// src/pages/IntegrationsPage.tsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Auth } from 'aws-amplify';
import {
  Plug,
  LayoutDashboard,
  CheckCircle,
  Circle,
  Info,
  XCircle
} from 'lucide-react';

// Define the possible connection statuses
type ConnectionStatus = 'loading' | 'connected' | 'disconnected' | 'error';

export function IntegrationsPage() {
  // --- State Hooks ---
  const [uberStatus, setUberStatus] = useState<ConnectionStatus>('loading');
  const [doorDashStatus, setDoorDashStatus] = useState<ConnectionStatus>('loading');
  const [skipStatus, setSkipStatus] = useState<ConnectionStatus>('loading');

  // --- Effects ---
  useEffect(() => {
    const timer = setTimeout(() => {
      setDoorDashStatus((prevStatus) => (prevStatus === 'loading' ? 'disconnected' : prevStatus));
      setSkipStatus((prevStatus) => (prevStatus === 'loading' ? 'disconnected' : prevStatus));
    }, 1500);

    const urlParams = new URLSearchParams(window.location.search);
    const statusParam = urlParams.get('status');
    const serviceParam = urlParams.get('service');

    if (serviceParam === 'uber') {
        if (statusParam === 'success') {
            setUberStatus('connected');
        } else if (statusParam === 'error') {
            setUberStatus('error');
            console.error("Uber Eats integration connection failed.");
        }
        // This line is perfect, it cleans the URL after you read the params
        window.history.replaceState({}, document.title, window.location.pathname);
    } else {
      // Set default Uber status if no param
      setUberStatus((prevStatus) => (prevStatus === 'loading' ? 'disconnected' : prevStatus));
    }

    return () => clearTimeout(timer);
  }, []); // This empty array [] correctly makes this run ONLY ONCE on mount

  // --- Handlers ---
  const handleUberConnect = async () => {
    console.log('Initiating Uber Eats connection...');
    
    try {
      // Get the current authenticated user
      const currentUser = await Auth.currentAuthenticatedUser();
      const userId = currentUser.attributes.sub;
      
      if (!userId) {
        console.error("Unable to retrieve user ID from authentication.");
        alert("Authentication error: Unable to retrieve user information.");
        return;
      }

      const clientId = import.meta.env.VITE_UBER_CLIENT_ID;
      const redirectUri = import.meta.env.VITE_UBER_REDIRECT_URI; 

      if (!clientId) {
          console.error("Uber Client ID is not configured in environment variables (VITE_UBER_CLIENT_ID).");
          alert("Configuration error: Unable to initiate Uber Eats connection. Client ID missing.");
          return;
      }
      
      if (!redirectUri || redirectUri.includes('YOUR_BACKEND')) {
           console.error("Uber Backend Callback URL is not configured in .env (VITE_UBER_REDIRECT_URI).");
           alert("Configuration error: Backend callback URL is missing.");
           return;
      }

      const scope = 'eats.pos_provisioning';
      // Pass the user ID as the state parameter
      const authorizeUrl = `https://auth.uber.com/oauth/v2/authorize?client_id=${clientId}&response_type=code&scope=${scope}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${encodeURIComponent(userId)}`;
      window.location.href = authorizeUrl;
    } catch (error) {
      console.error("Error initiating Uber Eats connection:", error);
      alert("Authentication error: Please ensure you are logged in.");
    }
  };

  const handleDoorDashConnect = () => {
      console.log('Initiating DoorDash connection...');
      alert('DoorDash connection flow will be initiated here');
  };

  const handleSkipConnect = () => {
      console.log('Initiating SkipTheDishes connection...');
      alert('SkipTheDishes connection flow will be initiated here');
  };

  // --- Component Return ---
  return (
    <div className="p-4 lg:p-6 bg-gray-900 min-h-screen text-gray-100">
      <header className="flex flex-col sm:flex-row justify-between items-center pb-6 border-b border-gray-700 mb-6">
        <div className="flex items-center gap-3 mb-4 sm:mb-0">
          <Plug className="w-8 h-8 text-indigo-400" strokeWidth={1.5} />
          <h1 className="text-3xl font-bold text-white tracking-tight">Integrations</h1>
        </div>
        <Link to="/dashboard" className="flex items-center gap-2 text-sm font-medium text-gray-300 hover:text-white transition-colors">
          <LayoutDashboard className="w-5 h-5" strokeWidth={1.5} />
          Back to Dashboard
        </Link>
      </header>

      <main className="max-w-5xl">
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-white mb-2">Connection Hub</h2>
          <p className="text-gray-400 text-sm">Connect your PrepDeck account to delivery platforms to automatically receive and manage orders.</p>
        </div>

        {/* Global error message for Uber */}
        {uberStatus === 'error' && (
          <div className="bg-red-900/50 border border-red-700 text-red-300 p-4 rounded-lg mb-6 flex items-center gap-3">
            <XCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm font-medium">
              There was an error connecting your Uber Eats account. Please try again or contact support.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Uber Eats Card */}
          <div className={`bg-gray-800 rounded-lg border ${uberStatus === 'error' ? 'border-red-700' : 'border-gray-700'} hover:border-gray-600 transition-all p-6 flex flex-col`}>
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center">
                <span className="text-green-400 font-semibold text-lg tracking-tight">UE</span>
              </div>
              {uberStatus === 'connected' ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20">
                  <CheckCircle className="w-3.5 h-3.5" strokeWidth={1.5} />
                  Connected
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-700 text-gray-400 border border-gray-600">
                  <Circle className="w-3.5 h-3.5" strokeWidth={1.5} />
                  Available
                </span>
              )}
            </div>
            
            <h3 className="text-base font-semibold text-white mb-2">Uber Eats</h3>
            <p className="text-sm text-gray-400 mb-6 flex-grow">Receive orders directly from Uber Eats to your dashboard in real-time.</p>
            
            {uberStatus === 'connected' ? (
              <div className="space-y-2">
                <button className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium rounded-md transition-colors border border-gray-600 hover:border-gray-500">
                  Manage Connection
                </button>
                <button className="w-full px-4 py-2 text-gray-300 hover:text-white text-sm font-medium transition-colors">
                  Disconnect
                </button>
              </div>
            ) : (
              <button 
                onClick={handleUberConnect}
                className="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-md transition-colors"
                disabled={uberStatus === 'loading'}
              >
                {uberStatus === 'loading' ? 'Loading...' : 'Connect to Uber Eats'}
              </button>
            )}
          </div>

          {/* DoorDash Card */}
          <div className="bg-gray-800 rounded-lg border border-gray-700 hover:border-gray-600 transition-all p-6 flex flex-col">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-red-500/10 rounded-lg flex items-center justify-center">
                <span className="text-red-400 font-semibold text-lg tracking-tight">DD</span>
              </div>
              {doorDashStatus === 'connected' ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20">
                  <CheckCircle className="w-3.5 h-3.5" strokeWidth={1.5} />
                  Connected
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-700 text-gray-400 border border-gray-600">
                  <Circle className="w-3.5 h-3.5" strokeWidth={1.5} />
                  Available
                </span>
              )}
            </div>
            
            <h3 className="text-base font-semibold text-white mb-2">DoorDash</h3>
            <p className="text-sm text-gray-400 mb-6 flex-grow">Sync your DoorDash orders and streamline your kitchen operations.</p>
            
            {doorDashStatus === 'connected' ? (
              <div className="space-y-2">
                <button className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium rounded-md transition-colors border border-gray-600 hover:border-gray-500">
                  Manage Connection
                </button>
                <button className="w-full px-4 py-2 text-gray-300 hover:text-white text-sm font-medium transition-colors">
                  Disconnect
                </button>
              </div>
            ) : (
              <button 
                onClick={handleDoorDashConnect}
                className="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-md transition-colors"
                disabled={doorDashStatus === 'loading'}
              >
                {doorDashStatus === 'loading' ? 'Loading...' : 'Connect to DoorDash'}
              </button>
            )}
          </div>

          {/* SkipTheDishes Card */}
          <div className="bg-gray-800 rounded-lg border border-gray-700 hover:border-gray-600 transition-all p-6 flex flex-col">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-orange-500/10 rounded-lg flex items-center justify-center">
                <span className="text-orange-400 font-semibold text-lg tracking-tight">ST</span>
              </div>
              {skipStatus === 'connected' ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20">
                  <CheckCircle className="w-3.5 h-3.5" strokeWidth={1.5} />
                  Connected
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-700 text-gray-400 border border-gray-600">
                  <Circle className="w-3.5 h-3.5" strokeWidth={1.5} />
                  Available
                </span>
              )}
            </div>
            
            <h3 className="text-base font-semibold text-white mb-2">SkipTheDishes</h3>
            <p className="text-sm text-gray-400 mb-6 flex-grow">Connect SkipTheDishes to manage all orders in one centralized location.</p>
            
            {skipStatus === 'connected' ? (
              <div className="space-y-2">
                <button className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium rounded-md transition-colors border border-gray-600 hover:border-gray-500">
                  Manage Connection
                </button>
                <button className="w-full px-4 py-2 text-gray-300 hover:text-white text-sm font-medium transition-colors">
                  Disconnect
                </button>
              </div>
            ) : (
              <button 
                onClick={handleSkipConnect}
                className="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-md transition-colors"
                disabled={skipStatus === 'loading'}
              >
                {skipStatus === 'loading' ? 'Loading...' : 'Connect to Skip'}
              </button>
            )}
          </div>
        </div>

        {/* Info Section */}
        <div className="mt-8 bg-gray-800/50 rounded-lg border border-gray-700 p-6">
          <div className="flex gap-4">
            <div className="flex-shrink-0">
              <Info className="w-5 h-5 text-indigo-400" strokeWidth={1.5} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white mb-2">How Integrations Work</h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                When you connect a delivery platform, PrepDeck will automatically receive new orders and display them on your dashboard. You'll be able to manage orders from all platforms in one unified interface, making your kitchen operations more efficient.
              </p>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}

export default IntegrationsPage;