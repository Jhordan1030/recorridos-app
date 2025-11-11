import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Alert from './components/Alert';
import { AppProvider } from './context/AppContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AlertProvider } from './context/AlertContext'; // ✅ NUEVO
import Dashboard from './pages/Dashboard';
import Ninos from './pages/Ninos';
import Vehiculos from './pages/Vehiculos';
import Recorridos from './pages/Recorridos';
import Users from './pages/Users';
import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import './App.css';

// Ícono del menú (hamburguesa)
const MenuIcon = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
  </svg>
);

// Componente principal que usa el contexto de auth
function AppContent() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user, loading, isAdmin } = useAuth();

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <AppProvider>
      <Router>
        <div className="min-h-screen bg-gray-50 flex">
          {/* Alert Component - Ahora usa el contexto global */}
          <Alert />

          {/* Navbar - Solo mostrar si el usuario está autenticado */}
          {user && (
            <Navbar
              isOpen={isSidebarOpen}
              onClose={() => setIsSidebarOpen(false)}
              isAdmin={isAdmin}
            />
          )}

          {/* Contenido principal */}
          <main className={`flex-1 min-h-screen pt-4 pb-8 ${user ? 'md:pl-64' : ''} overflow-x-hidden`}>
            {/* Botón menú móvil - Solo mostrar si el usuario está autenticado */}
            {user && (
              <div className="md:hidden flex justify-start px-4 mb-4">
                <button
                  onClick={toggleSidebar}
                  className="p-2 text-white bg-indigo-600 rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-300 transition-shadow"
                  aria-label="Toggle Sidebar"
                >
                  <MenuIcon className="h-6 w-6" />
                </button>
              </div>
            )}

            {/* Rutas */}
            <div className="px-4 sm:px-8">
              <Routes>
                <Route 
                  path="/login" 
                  element={user ? <Navigate to="/dashboard" replace /> : <Login />} 
                />

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
            </div>
          </main>
        </div>
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