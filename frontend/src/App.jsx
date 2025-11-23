import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

// Páginas
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Gallery from './pages/Gallery';
import Purchase from './pages/Purchase';
import SignTransfer from './pages/SignTransfer';
import SecureDownload from './pages/SecureDownload';
import DemoPanel from './pages/DemoPanel';
import DatabaseView from './pages/DatabaseView';

// Componente de ruta protegida
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Rutas públicas */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Rutas protegidas */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/gallery"
            element={
              <ProtectedRoute>
                <Gallery />
              </ProtectedRoute>
            }
          />
          <Route
            path="/purchase/:assetId"
            element={
              <ProtectedRoute>
                <Purchase />
              </ProtectedRoute>
            }
          />
          <Route
            path="/sign-transfer/:transferId"
            element={
              <ProtectedRoute>
                <SignTransfer />
              </ProtectedRoute>
            }
          />
          <Route
            path="/download/:transferId"
            element={
              <ProtectedRoute>
                <SecureDownload />
              </ProtectedRoute>
            }
          />
          <Route
            path="/demo"
            element={
              <ProtectedRoute>
                <DemoPanel />
              </ProtectedRoute>
            }
          />
          <Route
            path="/database"
            element={
              <ProtectedRoute>
                <DatabaseView />
              </ProtectedRoute>
            }
          />

          {/* Redirección por defecto */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;