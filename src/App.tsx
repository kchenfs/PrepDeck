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
import { IntegrationsPage } from './pages/IntegrationsPage';
import { AuthLayout } from './components/auth/AuthLayout';

const ProtectedRoutesLayout = () => {
  const { authStatus } = useAuthenticator();
  
  if (authStatus !== 'authenticated') {
    return <AuthLayout />;
  }
  
  return <Outlet />;
};

function App() {
  return (
    <Authenticator.Provider>
      <Router>
        <Routes>
          <Route element={<ProtectedRoutesLayout />}>
            <Route path="/integrations" element={<IntegrationsPage />} />
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