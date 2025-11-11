import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Alert from './components/Alert';
import { AppProvider } from './context/AppContext';
import { AuthProvider, useAuth } from './context/AuthContext'; // ← Cambio aquí
import Dashboard from './pages/Dashboard';
import Ninos from './pages/Ninos';
import Vehiculos from './pages/Vehiculos';
import Recorridos from './pages/Recorridos';
import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';
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
  const { user, loading } = useAuth(); // ← Usamos nuestro contexto JWT

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  // Mostrar loading mientras verifica autenticación
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
          {/* Navbar - Solo mostrar si el usuario está autenticado */}
          {user && (
            <Navbar
              isOpen={isSidebarOpen}
              onClose={() => setIsSidebarOpen(false)}
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

            {/* Alert flotante */}
            <Alert />

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

                {/* Ruta catch-all para redirigir a dashboard si está autenticado, o login si no */}
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

// Componente principal envuelto en AuthProvider
function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;