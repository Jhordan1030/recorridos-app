import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Alert from './components/ui/Alert'; // ✅ CAMBIADO
import { AppProvider } from './context/AppContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AlertProvider } from './context/AlertContext';
import Dashboard from './pages/Dashboard';
import Ninos from './pages/Ninos';
import Vehiculos from './pages/Vehiculos';
import Recorridos from './pages/Recorridos';
import Users from './pages/Users';
import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import './App.css';

// Componente principal que usa el contexto de auth
function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Cargando aplicación...</p>
        </div>
      </div>
    );
  }

  return (
    <AppProvider>
      <Router>
        <Layout>
          <Alert />

          <Routes>
            <Route 
              path="/login" 
              element={user ? <Navigate to="/dashboard" replace /> : <Login />} 
            />

            {/* Rutas protegidas */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/ninos"
              element={
                <ProtectedRoute>
                  <Ninos />
                </ProtectedRoute>
              }
            />

            <Route
              path="/vehiculos"
              element={
                <ProtectedRoute>
                  <Vehiculos />
                </ProtectedRoute>
              }
            />

            <Route
              path="/recorridos"
              element={
                <ProtectedRoute>
                  <Recorridos />
                </ProtectedRoute>
              }
            />

            {/* Ruta de usuarios solo para admin */}
            <Route
              path="/users"
              element={
                <AdminRoute>
                  <Users />
                </AdminRoute>
              }
            />

            {/* Ruta catch-all */}
            <Route 
              path="*" 
              element={<Navigate to={user ? "/dashboard" : "/login"} replace />} 
            />
          </Routes>
        </Layout>
      </Router>
    </AppProvider>
  );
}

// Componente principal envuelto en los providers
function App() {
  return (
    <AlertProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </AlertProvider>
  );
}

export default App;