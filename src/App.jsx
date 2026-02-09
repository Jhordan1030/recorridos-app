import React from 'react';
import { Analytics } from '@vercel/analytics/react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Alert from './components/ui/Alert';
import { AppProvider } from './context/AppContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AlertProvider } from './context/AlertContext';
import Dashboard from './pages/Dashboard';
import Ninos from './pages/Ninos';
import Vehiculos from './pages/Vehiculos';
import Recorridos from './pages/Recorridos';
import Users from './pages/Users';
import Profile from './pages/Profile'; // ✅ Agregado
import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import './App.css';

// Componente principal que usa el contexto de auth
function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <div className="relative flex items-center justify-center mb-8">
          {/* Efecto de respiración (Glow) */}
          <div className="absolute inset-0 bg-primary-500/20 rounded-2xl blur-xl animate-pulse"></div>

          {/* Logo Container */}
          <div className="relative w-16 h-16 bg-primary-600 rounded-2xl flex items-center justify-center shadow-lg shadow-primary-500/30 ring-1 ring-white/10 z-10 transition-transform duration-700 hover:scale-105">
            <span className="text-white font-black text-3xl uppercase tracking-tighter">R</span>
          </div>
        </div>

        {/* Indicador de carga */}
        <div className="flex flex-col items-center gap-3">
          <h3 className="text-sm font-bold text-white tracking-widest uppercase opacity-80">Recorridos</h3>
          <div className="flex gap-1.5">
            <div className="w-1.5 h-1.5 bg-primary-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
            <div className="w-1.5 h-1.5 bg-primary-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
            <div className="w-1.5 h-1.5 bg-primary-500 rounded-full animate-bounce"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AppProvider>
      <Router>
        <Routes>
          {/* Login Route - Outside Layout */}
          <Route
            path="/login"
            element={user ? <Navigate to="/dashboard" replace /> : <Login />}
          />

          {/* Main App Routes - Inside Layout */}
          <Route
            path="/*"
            element={
              <Layout>
                <Alert />
                <Routes>
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

                  {/* ✅ RUTA DE PERFIL AGREGADA */}
                  <Route
                    path="/perfil"
                    element={
                      <ProtectedRoute>
                        <Profile />
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
            }
          />
        </Routes>
        <Analytics />
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