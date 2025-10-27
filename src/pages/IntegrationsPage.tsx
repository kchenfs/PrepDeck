// src/pages/IntegrationsPage.tsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Plug,
  LayoutDashboard,
  CheckCircle,
  Clock,
  Settings,
  Link2, // Icon for Connect button
  Loader2, // Icon for Loading state
  XCircle // Icon for Error state (optional)
} from 'lucide-react';

// Define the possible connection statuses
type ConnectionStatus = 'loading' | 'connected' | 'disconnected' | 'error';

// --- IMPORTANT: Build Configuration Note ---
// To use `import.meta.env`, ensure your tsconfig.json (and tsconfig.app.json if it overrides)
// has compilerOptions.target set to 'ES2020' or higher.
// Example in tsconfig.json:
// {
//   "compilerOptions": {
//     "target": "ES2020",
//     "module": "ESNext",
//     // ... other options
//   }
// }
// Also ensure your vite.config.ts doesn't explicitly target an older version.

export function IntegrationsPage() {
  // --- State Hooks ---
  const [uberStatus, setUberStatus] = useState<ConnectionStatus>('loading');
  const [doorDashStatus, setDoorDashStatus] = useState<ConnectionStatus>('loading'); // Placeholder
  const [skipStatus, setSkipStatus] = useState<ConnectionStatus>('loading'); // Placeholder

  // --- Effects ---
  // Fetch connection statuses on component mount
  useEffect(() => {
    // TODO: Replace this simulation with actual API calls to your backend
    // Your backend should check its database (e.g., DynamoDB) to see if
    // a connection record exists for the current user and each service.
    // Example: fetch('/api/integrations/status').then(...)

    // Simulate fetching status (replace with actual fetch)
    const timer = setTimeout(() => {
      // Example: Assume user is not connected initially, unless overridden by callback status
      setUberStatus((prevStatus) => (prevStatus === 'loading' ? 'disconnected' : prevStatus));
      setDoorDashStatus((prevStatus) => (prevStatus === 'loading' ? 'disconnected' : prevStatus));
      setSkipStatus((prevStatus) => (prevStatus === 'loading' ? 'disconnected' : prevStatus));
    }, 1500); // Simulate network delay

    // Check for callback status from URL (e.g., after successful backend handling)
    const urlParams = new URLSearchParams(window.location.search);
    const statusParam = urlParams.get('status');
    const serviceParam = urlParams.get('service'); // Optional: Add service param from backend redirect

    if (serviceParam === 'uber') {
        if (statusParam === 'success') {
            // If the backend redirected here after a successful connection
            setUberStatus('connected');
        } else if (statusParam === 'error') {
            setUberStatus('error');
            console.error("Uber Eats integration connection failed.");
            // Maybe show an error message to the user here
        }
        // Clean the URL query parameters
        window.history.replaceState({}, document.title, window.location.pathname);
    }


    // Cleanup function to clear the timer if the component unmounts
    return () => clearTimeout(timer);
  }, []); // Empty dependency array runs this effect only once on mount

  // --- Handlers ---
  const handleUberConnect = () => {
    console.log('Initiating Uber Eats connection...');

    // Read Client ID from Vite environment variables (must be prefixed with VITE_)
    // Ensure you have a .env file with VITE_UBER_CLIENT_ID=your_id
    const clientId = import.meta.env.VITE_UBER_CLIENT_ID;

    // --- IMPORTANT: Replace placeholder ---
    // This MUST be the HTTPS endpoint on your API Gateway that triggers your backend Lambda.
    // This URL also needs to be added to your "Allowed Redirect URIs" in the Uber Developer Dashboard.
    const redirectUri = 'YOUR_BACKEND_API_GATEWAY_CALLBACK_URL'; // e.g., 'https://your-api-id.execute-api.us-east-1.amazonaws.com/prod/auth/uber/callback'
    // --- End of Placeholders ---

    if (!clientId) {
        console.error("Uber Client ID is not configured in environment variables (VITE_UBER_CLIENT_ID).");
        alert("Configuration error: Unable to initiate Uber Eats connection. Client ID missing.");
        return;
    }
     if (!redirectUri || redirectUri === 'YOUR_BACKEND_API_GATEWAY_CALLBACK_URL') {
         console.error("Uber Backend Callback URL is not configured in the code.");
         alert("Configuration error: Backend callback URL is missing.");
         return;
     }

    const scope = 'eats.pos_provisioning';
    // Construct the authorization URL
    const authorizeUrl = `https://auth.uber.com/oauth/v2/authorize?client_id=${clientId}&response_type=code&scope=${scope}&redirect_uri=${encodeURIComponent(redirectUri)}`;

    // Redirect the user's browser to Uber to start the OAuth flow
    window.location.href = authorizeUrl;
  };

  // Placeholder handlers for other services
  const handleDoorDashConnect = () => {
      alert('DoorDash connection flow to be implemented.');
  };

  const handleSkipConnect = () => {
      alert('SkipTheDishes connection flow to be implemented.');
  };

  // --- Render Logic ---
  const renderStatusIndicator = (status: ConnectionStatus) => {
    switch (status) {
        case 'loading':
            return (
                <span className="flex items-center text-xs font-medium text-gray-400">
                <Loader2 className="w-4 h-4 mr-1 animate-spin" /> Checking...
                </span>
            );
        case 'connected':
            return (
                <span className="inline-flex items-center rounded-full bg-green-500/10 px-2 py-0.5 text-xs font-medium text-green-400 ring-1 ring-inset ring-green-500/20">
                <CheckCircle className="w-3 h-3 mr-1" /> Connected
                </span>
            );
         case 'error':
             return (
                 <span className="inline-flex items-center rounded-full bg-red-500/10 px-2 py-0.5 text-xs font-medium text-red-400 ring-1 ring-inset ring-red-500/20">
                     <XCircle className="w-3 h-3 mr-1" /> Connection Failed
                 </span>
             );
        case 'disconnected':
        default:
            return (
                <span className="inline-flex items-center rounded-full bg-gray-500/10 px-2 py-0.5 text-xs font-medium text-gray-400 ring-1 ring-inset ring-gray-500/20">
                Not Connected
                </span>
            );
    }
  };

  const renderUberSection = () => (
     <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
            {/* Using a placeholder - replace with actual logo if desired */}
            <img src="https://placehold.co/40x40/06C167/FFFFFF?text=UE" alt="Uber Eats Logo" className="w-10 h-10 rounded-md" />
            <div>
                <p className="font-semibold text-white">Uber Eats</p>
                <div className="mt-1">{renderStatusIndicator(uberStatus)}</div>
            </div>
        </div>
        {uberStatus === 'loading' && (
            <button className="h-9 px-4 rounded-md bg-gray-600 text-white/70 text-sm font-medium flex items-center justify-center gap-2 cursor-wait" disabled>
                <Loader2 className="w-4 h-4 animate-spin" /> Loading...
            </button>
        )}
        {(uberStatus === 'disconnected' || uberStatus === 'error') && (
            <button
                onClick={handleUberConnect}
                className="h-9 px-4 rounded-md bg-indigo-600 text-white text-sm font-medium ring-1 ring-white/10 hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition flex items-center justify-center gap-2"
            >
                <Link2 className="w-4 h-4" /> Connect
            </button>
        )}
        {uberStatus === 'connected' && (
            <div className="flex items-center gap-4">
                 <span className="text-xs text-gray-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Last sync: Just now {/* TODO: Fetch real sync time */}
                </span>
                {/* TODO: Add Manage/Disconnect functionality */}
                <button className="h-9 px-4 rounded-md bg-gray-600 hover:bg-gray-500 text-white text-sm font-medium ring-1 ring-white/10 transition flex items-center justify-center gap-2">
                    <Settings className="w-4 h-4" /> Manage
                </button>
            </div>
        )}
    </div>
  );

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

      <main className="max-w-5xl space-y-8">
        {/* Delivery Platform Integrations Section */}
        <div>
            <h2 className="text-lg font-semibold text-white mb-4">Delivery Platforms</h2>
            <div className="space-y-6 rounded-lg border border-gray-700 bg-gray-800/50 p-6">
                {/* Uber Eats */}
                {renderUberSection()}

                {/* --- Placeholder Sections for other platforms --- */}
                 <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 opacity-50"> {/* Added opacity for placeholder feel */}
                    <div className="flex items-center gap-4">
                        <img src="https://placehold.co/40x40/FF3008/FFFFFF?text=DD" alt="DoorDash Logo" className="w-10 h-10 rounded-md" />
                        <div>
                            <p className="font-semibold text-white">DoorDash</p>
                            <div className="mt-1">{renderStatusIndicator(doorDashStatus)}</div>
                        </div>
                    </div>
                     <button
                        onClick={handleDoorDashConnect}
                        disabled={doorDashStatus !== 'disconnected'} // Disable if loading or connected
                        className="h-9 px-4 rounded-md bg-gray-600 text-white/70 text-sm font-medium ring-1 ring-white/10 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Link2 className="w-4 h-4" /> Connect
                    </button>
                </div>

                 <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 opacity-50"> {/* Added opacity */}
                    <div className="flex items-center gap-4">
                         <img src="https://placehold.co/40x40/F78121/FFFFFF?text=S" alt="SkipTheDishes Logo" className="w-10 h-10 rounded-md" />
                        <div>
                            <p className="font-semibold text-white">SkipTheDishes</p>
                             <div className="mt-1">{renderStatusIndicator(skipStatus)}</div>
                        </div>
                    </div>
                     <button
                        onClick={handleSkipConnect}
                        disabled={skipStatus !== 'disconnected'} // Disable if loading or connected
                        className="h-9 px-4 rounded-md bg-gray-600 text-white/70 text-sm font-medium ring-1 ring-white/10 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Link2 className="w-4 h-4" /> Connect
                    </button>
                </div>
                {/* --- End Placeholder Sections --- */}
            </div>
        </div>

        {/* You could add other integration types here (e.g., POS Systems, Accounting Software) */}

      </main>
    </div>
  );
}

// Make sure the component is the default export
export default IntegrationsPage;

