import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // Importamos useNavigate
import { useAuth } from '../../context/AuthContext';
import { Menu, LogOut, User, X, ChevronDown, Settings } from 'lucide-react';

const Header = ({ onToggleSidebar, isSidebarOpen, isMobile }) => {
  const { user, isAdmin, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef(null);
  const navigate = useNavigate(); // Hook de navegación

  // --- LÓGICA INTELIGENTE DE NOMBRE (CACHE SEGURO) ---
  const extractName = (u) => {
    if (!u) return null;
    return u.nombre ||
      u.full_name ||
      u.user_metadata?.full_name ||
      u.user_metadata?.name;
  };

  const [displayName, setDisplayName] = useState(() => {
    const directName = extractName(user);
    if (directName) return directName;

    if (typeof window !== 'undefined' && user?.email) {
      try {
        const cachedData = JSON.parse(localStorage.getItem('authUserCache') || '{}');
        if (cachedData.email === user.email && cachedData.name) {
          return cachedData.name;
        }
      } catch (e) { }
    }
    return user?.email?.split('@')[0] || 'Usuario';
  });

  useEffect(() => {
    const realName = extractName(user);
    if (realName && user?.email) {
      setDisplayName(realName);
      localStorage.setItem('authUserCache', JSON.stringify({
        name: realName,
        email: user.email
      }));
    }
  }, [user]);

  const initial = displayName ? displayName.charAt(0).toUpperCase() : 'U';

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
    localStorage.removeItem('authUserCache');
    logout();
    setShowUserMenu(false);
  };

  // Función para navegar al perfil
  const goToProfile = () => {
    setShowUserMenu(false);
    navigate('/perfil'); // Navega a la ruta del perfil
  };

  return (
    <header className="sticky top-4 z-40 mx-2 lg:mx-6 rounded-2xl bg-white/80 backdrop-blur-md border border-slate-200 shadow-sm transition-all duration-300 mb-6">
      <div className="flex items-center justify-between h-14 px-4 sm:px-6">

        {/* Lado Izquierdo */}
        <div className="flex items-center">
          <button
            onClick={onToggleSidebar}
            data-sidebar-toggle="true"
            className={`p-2 mr-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all active:scale-95 ${isMobile ? 'lg:hidden' : 'hidden'}`}
            aria-label="Toggle Sidebar"
          >
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          <div className={`flex items-center space-x-3 sm:space-x-4 ${isMobile ? 'lg:hidden' : 'hidden'}`}>
            <div className="flex flex-col">
              <h1 className="text-lg font-bold text-slate-900 tracking-tight">Recorridos</h1>
            </div>
          </div>
        </div>

        {/* Lado Derecho */}
        <div className="flex items-center space-x-4">
          {isAdmin && (
            <div className="hidden md:flex items-center px-2.5 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full">
              <span className="text-amber-500 text-[10px] font-bold uppercase tracking-wider">Admin</span>
            </div>
          )}

          {/* Menú Usuario */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-3 p-1 rounded-full hover:bg-slate-100 transition-all border border-transparent hover:border-slate-200 focus:outline-none"
            >
              <div className="flex items-center space-x-2 pl-2">
                <span className="hidden sm:block text-xs font-semibold text-slate-700 tracking-tight">
                  {displayName}
                </span>
                <div className="w-8 h-8 bg-primary-50 border border-primary-100 rounded-full flex items-center justify-center text-primary-600 font-bold text-xs shadow-sm transition-all group-hover:border-primary-200">
                  {initial}
                </div>
              </div>
              <ChevronDown size={14} className={`text-slate-400 transition-transform duration-200 ${showUserMenu ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown refined */}
            {showUserMenu && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 p-1.5 z-50 animate-spring-in">
                <div className="px-4 py-3 border-b border-slate-100 mb-1">
                  <p className="text-sm font-bold text-slate-900 truncate tracking-tight">{displayName}</p>
                  <p className="text-[10px] text-slate-500 truncate mt-0.5 uppercase tracking-wider font-semibold">
                    {user?.email}
                  </p>
                </div>

                <div className="space-y-0.5">
                  <button
                    onClick={goToProfile}
                    className="flex items-center space-x-3 w-full px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-all"
                  >
                    <User size={14} className="opacity-50" />
                    <span>Mi Perfil</span>
                  </button>

                  <button
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center space-x-3 w-full px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-all"
                  >
                    <Settings size={14} className="opacity-50" />
                    <span>Ajustes</span>
                  </button>

                  <div className="my-1 border-t border-slate-100 mx-1" />

                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-3 w-full px-3 py-2 text-xs font-medium text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all"
                  >
                    <LogOut size={14} className="opacity-70" />
                    <span>Cerrar Sesión</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;