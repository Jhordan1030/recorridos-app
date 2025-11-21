import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
// import { useApp } from '../../context/AppContext'; // Ya no necesitamos useApp aquí si solo era para el tema
import { Menu, LogOut, User, X, ChevronDown, Settings } from 'lucide-react';

const Header = ({ onToggleSidebar, isSidebarOpen, isMobile }) => {
  const { user, isAdmin, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef(null);

  // Cerrar el menú al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
  };

  return (
    <header className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-b border-gray-200/80 dark:border-slate-800 sticky top-0 z-40 shadow-sm shadow-black/5">
      <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
        {/* Lado izquierdo - Navegación móvil */}
        <div className="flex items-center">
          {/* Botón menú móvil */}
          <button
            onClick={onToggleSidebar}
            data-sidebar-toggle="true"
            className={`p-2.5 text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100/80 dark:hover:bg-slate-800 rounded-xl transition-all duration-300 ease-out focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:ring-offset-2 ${isMobile ? 'lg:hidden' : 'hidden'
              }`}
            aria-label="Toggle Sidebar"
          >
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          {/* Título para móvil */}
          <div className={`flex items-center space-x-3 ${isMobile ? 'lg:hidden' : 'hidden'}`}>
            <div className="w-9 h-9 bg-gradient-to-br from-primary-600 to-primary-700 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/25 ring-2 ring-white">
              <span className="text-white font-bold text-sm">🚌</span>
            </div>
            <div className="flex flex-col">
              <h1 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">Recorridos</h1>
              <p className="text-xs text-gray-600 dark:text-slate-400 font-medium">Panel de control</p>
            </div>
          </div>
        </div>

        {/* Lado derecho - Badges y Menú Usuario */}
        <div className="flex items-center space-x-4">

          {/* Badge de admin - Solo desktop */}
          {isAdmin && (
            <div className="hidden sm:flex items-center space-x-2.5 bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200/80 px-3.5 py-2 rounded-2xl shadow-sm ring-1 ring-yellow-200/50">
              <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse ring-2 ring-amber-200"></div>
              <span className="text-amber-800 text-sm font-semibold tracking-tight">Administrador</span>
            </div>
          )}

          {/* Menú de usuario */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="group flex items-center space-x-3 p-2 rounded-2xl hover:bg-gray-50/80 dark:hover:bg-slate-800 transition-all duration-300 ease-out border border-transparent hover:border-gray-200/50 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:ring-offset-2"
            >
              {/* Información del usuario - Solo desktop */}
              <div className="hidden sm:block text-right">
                <p className="text-sm font-semibold text-gray-900 dark:text-white tracking-tight">
                  {user?.nombre || 'Usuario'}
                </p>
                <p className="text-xs text-gray-600 dark:text-slate-400 font-medium tracking-wide">
                  {user?.email}
                </p>
              </div>

              {/* Avatar del usuario */}
              <div className="flex items-center space-x-2.5">
                <div className="relative">
                  <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-primary-700 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-primary-500/30 ring-2 ring-white transition-all duration-300 group-hover:scale-105 group-hover:shadow-primary-500/40">
                    {user?.nombre?.charAt(0)?.toUpperCase() || 'U'}
                  </div>

                  {/* Indicador de estado */}
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full shadow-sm ring-1 ring-emerald-400"></div>
                </div>

                {/* Chevron */}
                <ChevronDown
                  size={16}
                  className={`text-gray-500 dark:text-slate-400 transition-all duration-300 ease-out ${showUserMenu ? 'rotate-180 text-gray-700 dark:text-white' : 'group-hover:text-gray-700 dark:group-hover:text-white'
                    }`}
                />
              </div>
            </button>

            {/* Dropdown menu */}
            {showUserMenu && (
              <div className="absolute right-0 top-full mt-2 w-72 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-200/80 dark:border-slate-800 py-2 z-50 ring-1 ring-black/5 animate-in fade-in-0 zoom-in-95">
                {/* Header del menú */}
                <div className="px-5 py-4 border-b border-gray-200/60 dark:border-slate-800">
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <div className="w-12 h-12 bg-gradient-to-br from-primary-600 to-primary-700 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg ring-2 ring-white">
                        {user?.nombre?.charAt(0)?.toUpperCase() || 'U'}
                      </div>
                      <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-md ring-1 ring-gray-200">
                        <div className="w-3 h-3 bg-emerald-500 rounded-full ring-1 ring-white"></div>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white truncate tracking-tight">
                        {user?.nombre || 'Usuario'}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-slate-400 truncate mt-0.5 font-medium">
                        {user?.email}
                      </p>
                      <div className="mt-2">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold tracking-wide ${isAdmin
                            ? 'bg-amber-100 text-amber-800 border border-amber-200/60'
                            : 'bg-primary-100 text-primary-800 border border-primary-200/60'
                          }`}>
                          {isAdmin ? 'Administrador' : 'Usuario'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Opciones del menú */}
                <div className="py-2">
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      // Navegación perfil
                    }}
                    className="flex items-center space-x-3 w-full px-5 py-3 text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-50/80 dark:hover:bg-slate-800 transition-all duration-200 ease-out group"
                  >
                    <div className="p-1.5 bg-gray-100 dark:bg-slate-800 rounded-lg group-hover:bg-gray-200 dark:group-hover:bg-slate-700 transition-colors duration-200">
                      <User size={16} className="text-gray-600 dark:text-slate-400" />
                    </div>
                    <span className="font-medium tracking-wide">Mi perfil</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      // Navegación configuración
                    }}
                    className="flex items-center space-x-3 w-full px-5 py-3 text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-50/80 dark:hover:bg-slate-800 transition-all duration-200 ease-out group"
                  >
                    <div className="p-1.5 bg-gray-100 dark:bg-slate-800 rounded-lg group-hover:bg-gray-200 dark:group-hover:bg-slate-700 transition-colors duration-200">
                      <Settings size={16} className="text-gray-600 dark:text-slate-400" />
                    </div>
                    <span className="font-medium tracking-wide">Configuración</span>
                  </button>

                  <div className="mx-5 my-1 h-px bg-gray-200/60 dark:bg-slate-800"></div>

                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-3 w-full px-5 py-3 text-sm text-red-600 hover:bg-red-50/80 dark:hover:bg-red-900/20 transition-all duration-200 ease-out group"
                  >
                    <div className="p-1.5 bg-red-100 dark:bg-red-900/30 rounded-lg group-hover:bg-red-200 dark:group-hover:bg-red-800/50 transition-colors duration-200">
                      <LogOut size={16} className="text-red-500" />
                    </div>
                    <span className="font-medium tracking-wide">Cerrar sesión</span>
                  </button>
                </div>

                {/* Footer del menú */}
                <div className="px-5 py-3 border-t border-gray-200/60 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/50 rounded-b-2xl">
                  <div className="text-xs text-gray-500 dark:text-slate-500 text-center font-medium tracking-wide">
                    Recorridos App v2.0.0
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Barra de progreso sutil */}
      <div className="h-0.5 bg-gradient-to-r from-transparent via-primary-500/20 to-transparent animate-pulse"></div>
    </header>
  );
};

export default Header;