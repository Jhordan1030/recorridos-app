// src/App.jsx
import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
// Importa los componentes de tu aplicación
import Navbar from './components/Navbar';
import Alert from './components/Alert';
import { AppProvider } from './context/AppContext';
import Dashboard from './pages/Dashboard';
import Ninos from './pages/Ninos';
import Vehiculos from './pages/Vehiculos';
import Recorridos from './pages/Recorridos';
import './App.css'; 
// Importamos el ícono de menú (asumiendo que se coloca aquí si no usas librerías)

// Componente de Ícono de Menú Simple (Hamburguesa)
const MenuIcon = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
  </svg>
);


function App() {
  // Estado para controlar si el sidebar está abierto en móviles
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); 

  // Función para alternar la visibilidad
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <AppProvider>
      <Router>
        {/* El div principal debe ser flex para que la navegación fija funcione bien */}
        <div className="min-h-screen bg-gray-50 flex"> 
          
          {/* 1. Sidebar (Navbar): Se le pasa el estado del menú móvil */}
          {/* La Navbar ahora maneja su propio estilo fijo/modal */}
          <Navbar 
            isOpen={isSidebarOpen} 
            onClose={() => setIsSidebarOpen(false)} 
          />
          
          {/* 2. Main Content Wrapper: El contenido empieza a la derecha del sidebar en pantallas >= md */}
          {/* Añadimos padding a la izquierda (pl-64) para compensar la Navbar fija de 256px de ancho */}
          <main className="flex-1 min-h-screen pt-4 pb-8 md:pl-64 overflow-x-hidden"> 
            
            {/* Cabecera Responsiva para el Botón de Menú (Solo en pantallas pequeñas) */}
            <div className="md:hidden flex justify-start px-4 mb-4">
              <button 
                onClick={toggleSidebar} 
                className="p-2 text-white bg-indigo-600 rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-300 transition-shadow"
                aria-label="Toggle Sidebar"
              >
                <MenuIcon className="h-6 w-6" />
              </button>
            </div>

            {/* Alert flotante, fuera del contenedor flex principal para que flote bien */}
            <Alert />

            {/* Contenido de las Rutas */}
            <div className="px-4 sm:px-8">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/ninos" element={<Ninos />} />
                <Route path="/vehiculos" element={<Vehiculos />} />
                <Route path="/recorridos" element={<Recorridos />} />
              </Routes>
            </div>
          </main>
        </div>
      </Router>
    </AppProvider>
  );
}

export default App;


