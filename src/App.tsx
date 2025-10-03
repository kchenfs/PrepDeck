// App.tsx

import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  Outlet,
} from 'react-router-dom';
import { Authenticator, useAuthenticator } from '@aws-amplify/ui-react';
import { DashboardPage } from './pages/DashboardPage';
import { HistoryPage } from './pages/HistoryPage';
// ⭐️ CHANGE: Import the new AuthLayout
import { AuthLayout } from './components/auth/AuthLayout';

const ProtectedRoutesLayout = () => {
  const { authStatus } = useAuthenticator();
  
  if (authStatus !== 'authenticated') {
    // ⭐️ CHANGE: Render AuthLayout instead of RestoDashSignIn directly
    return <AuthLayout />;
  }
  
  return <Outlet />;
};

function App() {
  return (
    // Authenticator.Provider gives you access to useAuthenticator hook AND handles auth state
    <Authenticator.Provider>
      <Router>
        <Routes>
          <Route element={<ProtectedRoutesLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/history" element={<HistoryPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" />} />
        </Routes>
      </Router>
    </Authenticator.Provider>
  );
}

export default App;