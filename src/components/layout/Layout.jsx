import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import Sidebar from './Sidebar';
import Header from './Header';

const Layout = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { user, isAdmin } = useAuth();
  const sidebarRef = useRef(null);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setIsSidebarOpen(false);

  // Detectar dispositivo y manejar responsive
  useEffect(() => {
    const checkDevice = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      
      // En desktop, siempre mostrar sidebar abierto
      if (!mobile) {
        setIsSidebarOpen(false); // Cambiado a false para que no interfiera
      } else {
        setIsSidebarOpen(false); // En móvil empezar cerrado
      }
    };

    checkDevice();
    window.addEventListener('resize', checkDevice);
    
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  // Cerrar sidebar al hacer clic fuera en móvil - CORREGIDO
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Solo cerrar si es móvil, el sidebar está abierto y se hizo clic fuera
      if (isMobile && isSidebarOpen && 
          sidebarRef.current && 
          !sidebarRef.current.contains(event.target) &&
          !event.target.closest('[data-sidebar-toggle]')) {
        closeSidebar();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isMobile, isSidebarOpen]);

  // Prevenir scroll del body cuando el sidebar está abierto en móvil
  useEffect(() => {
    if (isMobile && isSidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobile, isSidebarOpen]);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      {user && (
        <div ref={sidebarRef}>
          <Sidebar
            isOpen={isSidebarOpen}
            onClose={closeSidebar}
            isAdmin={isAdmin}
            isMobile={isMobile}
          />
        </div>
      )}

      {/* Contenido principal */}
      <div className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${
        user && !isMobile && isSidebarOpen ? 'lg:ml-80' : 'lg:ml-0'
      }`}>
        {/* Header */}
        {user && (
          <Header 
            onToggleSidebar={toggleSidebar} 
            isSidebarOpen={isSidebarOpen}
            isMobile={isMobile}
          />
        )}

        {/* Contenido de la página */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50">
          <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-4 lg:py-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;