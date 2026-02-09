import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import Sidebar from './Sidebar';
import Header from './Header';
import { useApp } from '../../context/AppContext';
// 1. IMPORTAR EL BOTÓN AQUÍ
// Asumiendo que FloatingThemeToggle.jsx está en src/components/ui/

const Layout = ({ children }) => {
  const { isMobile, setIsMobile } = useApp();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { user, isAdmin } = useAuth();
  const sidebarRef = useRef(null);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setIsSidebarOpen(false);

  // No local resize needed, AppContext handles it. 
  // We just sync sidebar state if isMobile changes.
  useEffect(() => {
    if (!isMobile) setIsSidebarOpen(false);
  }, [isMobile]);

  // Cerrar sidebar al hacer clic fuera en móvil
  useEffect(() => {
    const handleClickOutside = (event) => {
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
    <div className="min-h-screen flex transition-colors duration-300">
      {/* Sidebar */}
      {user && (
        <div ref={sidebarRef}>
          <Sidebar
            isOpen={isSidebarOpen}
            onClose={closeSidebar}
            isAdmin={isAdmin}
            isMobile={isMobile}
            isCollapsed={isCollapsed}
            setIsCollapsed={setIsCollapsed}
          />
        </div>
      )}

      {/* Contenido principal */}
      <div className="flex-1 flex flex-col min-h-screen transition-all duration-500">
        <div className="flex flex-1">
          {/* Espaciador para el Sidebar Flotante en Desktop */}
          {user && !isMobile && (
            <div className={`hidden lg:block ${isCollapsed ? 'w-32' : 'w-[22rem]'} flex-shrink-0 transition-all duration-500 ease-in-out`} />
          )}

          <div className="flex-1 flex flex-col min-w-0">
            {/* Header */}
            {user && (
              <Header
                onToggleSidebar={toggleSidebar}
                isSidebarOpen={isSidebarOpen}
                isMobile={isMobile}
              />
            )}

            {/* Contenido de la página */}
            <main className="flex-1 overflow-x-hidden overflow-y-auto">
              <div className="container mx-auto px-4 lg:px-8 py-6 lg:py-8">
                {children}
              </div>
            </main>
          </div>
        </div>
      </div>


    </div>
  );
};

export default Layout;