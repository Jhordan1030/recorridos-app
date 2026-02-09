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
    <header className="glass-navbar sticky top-4 z-40 mx-4 mt-4 lg:ml-auto lg:w-fit rounded-[2rem] border border-white/10">
      <div className="flex items-center justify-between h-16 px-6 sm:px-8 lg:px-10 space-x-8">

        {/* Lado Izquierdo */}
        <div className="flex items-center">
          <button
            onClick={onToggleSidebar}
            data-sidebar-toggle="true"
            className={`p-2.5 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-300 ease-out focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:ring-offset-2 ${isMobile ? 'lg:hidden' : 'hidden'}`}
            aria-label="Toggle Sidebar"
          >
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          <div className={`flex items-center space-x-3 ${isMobile ? 'lg:hidden' : 'hidden'}`}>
            <div className="w-9 h-9 bg-gradient-to-br from-primary-600 to-primary-700 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/25 ring-2 ring-white">
              <span className="text-white font-bold text-sm">🚌</span>
            </div>
            <div className="flex flex-col">
              <h1 className="text-xl font-black text-white tracking-tighter">Recorridos</h1>
              <p className="text-[10px] text-white/30 font-black uppercase tracking-widest leading-none">Panel de control</p>
            </div>
          </div>
        </div>

        {/* Lado Derecho */}
        <div className="flex items-center space-x-4">
          {isAdmin && (
            <div className="hidden sm:flex items-center space-x-2.5 bg-amber-400/20 border border-amber-400/30 px-3.5 py-1.5 rounded-full shadow-lg ring-1 ring-amber-400/20">
              <div className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(251,191,36,0.8)]"></div>
              <span className="text-amber-400 text-[10px] font-black uppercase tracking-widest">Administrador</span>
            </div>
          )}

          {/* Menú Usuario */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="group flex items-center space-x-3 p-2 rounded-2xl hover:bg-white/5 transition-all duration-300 ease-out border border-transparent hover:border-gray-200/50 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:ring-offset-2"
            >
              <div className="hidden sm:block text-right">
                <p className="text-sm font-black text-white tracking-tighter">
                  {displayName}
                </p>
                <p className="text-[10px] font-black text-white/30 uppercase tracking-widest truncate">
                  {isAdmin ? 'Administrador' : 'Usuario'}
                </p>
              </div>

              <div className="flex items-center space-x-2.5">
                <div className="relative">
                  <div className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center text-white font-black text-sm shadow-xl border border-white/20 transition-all duration-300 group-hover:bg-white/20">
                    {initial}
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-500 border-2 border-[#020617] rounded-full shadow-lg"></div>
                </div>
                <ChevronDown size={14} className={`text-white/40 transition-all duration-300 ease-out ${showUserMenu ? 'rotate-180 text-white' : 'group-hover:text-white'}`} />
              </div>
            </button>

            {/* Dropdown */}
            {showUserMenu && (
              <div className="absolute right-0 top-full mt-3 w-72 bg-white/5 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/10 py-0 z-50 overflow-hidden ring-1 ring-white/10">
                <div className="px-6 py-6 border-b border-white/10">
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-xl border border-white/20">
                        {initial}
                      </div>
                      <div className="absolute -bottom-1 -right-1 bg-emerald-500 w-4 h-4 rounded-full border-4 border-[#020617]"></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-base font-black text-white truncate tracking-tighter">
                        {displayName}
                      </p>
                      <p className="text-[10px] font-black text-white/30 truncate mt-0.5 uppercase tracking-widest">
                        {user?.rol === 'admin' ? 'Administrador del Sistema' : 'Nivel de Usuario'}
                      </p>
                      <div className="mt-3">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${isAdmin ? 'bg-amber-400/20 text-amber-400 border-amber-400/20' : 'bg-primary-400/20 text-primary-400 border-primary-400/20'}`}>
                          {isAdmin ? 'Administrador' : 'Usuario'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="py-2">
                  <button
                    onClick={goToProfile}
                    className="flex items-center space-x-4 w-full px-6 py-4 text-sm text-white/70 hover:bg-white/5 transition-all duration-200 group"
                  >
                    <User size={18} className="text-white/30 group-hover:text-white transition-colors" />
                    <span className="font-black uppercase tracking-widest text-[10px]">Mi perfil</span>
                  </button>

                  <button
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center space-x-4 w-full px-6 py-4 text-sm text-white/70 hover:bg-white/5 transition-all duration-200 group"
                  >
                    <Settings size={18} className="text-white/30 group-hover:text-white transition-colors" />
                    <span className="font-black uppercase tracking-widest text-[10px]">Configuración</span>
                  </button>

                  <div className="mx-6 my-2 h-px bg-white/5"></div>

                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-4 w-full px-6 py-4 text-sm text-red-400 hover:bg-red-400/10 transition-all duration-200 group"
                  >
                    <LogOut size={18} className="text-red-400/50 group-hover:text-red-400 transition-colors" />
                    <span className="font-black uppercase tracking-widest text-[10px]">Cerrar sesión</span>
                  </button>
                </div>

                <div className="px-6 py-4 bg-white/5 border-t border-white/5">
                  <div className="text-[10px] text-white/20 text-center font-black uppercase tracking-[0.2em]">
                    Recorridos App v3.1.3
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
    </header>
  );
};

export default Header;