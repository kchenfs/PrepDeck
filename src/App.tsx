// src/App.tsx
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import { DashboardPage } from './pages/DashboardPage';
import { LoginPage } from './pages/LoginPage';
import { HistoryPage } from './pages/HistoryPage';

function App() {
  // In a real application, you would have a state that tracks
  // if the user is authenticated. We'll simulate it for now.
  const isAuthenticated = true; // Change this to `false` to see the login page

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/dashboard"
          element={
            isAuthenticated ? <DashboardPage /> : <Navigate to="/login" />
          }
        />
        <Route
          path="/history"
          element={
            isAuthenticated ? <HistoryPage /> : <Navigate to="/login" />
          }
        />
        {/* Redirect root path to the dashboard */}
        <Route
          path="/"
          element={<Navigate to="/dashboard" />}
        />
      </Routes>
    </Router>
  );
}

export default App;