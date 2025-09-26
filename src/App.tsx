// src/App.tsx
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  Outlet,
} from 'react-router-dom';
import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import { DashboardPage } from './pages/DashboardPage';
import { HistoryPage } from './pages/HistoryPage';

/**
 * A layout component that protects all its child routes.
 * If the user is not authenticated, it will render the Amplify Sign-In UI
 * with the Google social provider button.
 */
const ProtectedRoutesLayout = () => {
  return (
    // This Authenticator component now protects all nested routes
    // and is configured to show the Google sign-in option.
    <Authenticator socialProviders={['google']}>
      {/* The Outlet will render the matched child route (e.g., DashboardPage) */}
      <Outlet />
    </Authenticator>
  );
};

function App() {
  return (
    <Authenticator.Provider>
      <Router>
        <Routes>
          {/* All routes within ProtectedRoutesLayout require authentication */}
          <Route element={<ProtectedRoutesLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/history" element={<HistoryPage />} />
          </Route>
          
          {/* Redirect any unmatched route to the dashboard */}
          <Route path="*" element={<Navigate to="/dashboard" />} />
        </Routes>
      </Router>
    </Authenticator.Provider>
  );
}

export default App;