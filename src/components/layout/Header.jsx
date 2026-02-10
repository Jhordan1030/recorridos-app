import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LogOut,
  User,
  ChevronDown,
  Settings,
  Home,
  MapPin,
  Users,
  Car,
  Bell
} from 'lucide-react';

const Header = ({ isMobile }) => {
  const { user, isAdmin, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

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

  const goToProfile = () => {
    setShowUserMenu(false);
    navigate('/perfil');
  };

  const navItems = [
    { icon: Home, path: '/dashboard', label: 'Inicio' },
    { icon: MapPin, path: '/recorridos', label: 'Rutas' },
    { icon: Users, path: '/ninos', label: 'Niños' },
    { icon: Car, path: '/vehiculos', label: 'Vehículos' },
  ];

  return (
    <header className="hidden md:block sticky top-0 z-50 bg-white/80 backdrop-blur-2xl border-b border-white/20 shadow-sm transition-all duration-300">
      <div className="max-w-[2000px] mx-auto px-4 h-16 flex items-center justify-between gap-4">

        {/* --- LEFT: Logo & Brand --- */}
        <div className="flex items-center gap-3 shrink-0">
          <Link to="/dashboard" className="flex items-center gap-2 group">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-indigo-700 rounded-2xl flex items-center justify-center shadow-lg shadow-primary-600/20 transition-transform group-hover:scale-105">
              <span className="text-white font-black text-xl tracking-tighter">R</span>
            </div>
            <span className={`text-xl font-bold text-slate-900 tracking-tight hidden sm:block ${isMobile ? 'hidden' : ''}`}>Recorridos</span>
          </Link>
        </div>

        {/* --- CENTER: Desktop Navigation (Facebook Style - iOS Glass) --- */}
        <div className="hidden lg:flex items-center justify-center flex-1 max-w-2xl px-4">
          <nav className="flex items-center justify-between w-full bg-slate-100/50 p-1 rounded-2xl border border-white/50 backdrop-blur-sm">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path || (item.path === '/dashboard' && location.pathname === '/');
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`
                          relative group flex items-center justify-center w-full h-10 rounded-xl transition-all duration-300
                          ${isActive
                      ? 'text-primary-600 bg-white shadow-sm ring-1 ring-black/5'
                      : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
                    }
                       `}
                  title={item.label}
                >
                  <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                </Link>
              )
            })}
          </nav>
        </div>

        {/* --- RIGHT: User Profile & Actions --- */}
        <div className="flex items-center gap-3 shrink-0 justify-end">
          {isAdmin && (
            <div className="hidden md:flex items-center px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full">
              <span className="text-amber-600 text-[10px] font-bold uppercase tracking-wider">Admin</span>
            </div>
          )}

          {/* Notifications Placeholder */}
          <button className="hidden md:flex w-10 h-10 rounded-full bg-slate-50/80 hover:bg-slate-100 items-center justify-center text-slate-600 transition-colors border border-transparent hover:border-slate-200">
            <Bell size={20} />
          </button>

          {/* User Menu */}
          {/* User Menu - Hidden on Mobile (available in BottomNav) */}
          <div className="relative hidden md:block" ref={userMenuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 p-1 pl-2 rounded-full hover:bg-slate-50 transition-all border border-transparent hover:border-slate-200 focus:outline-none"
            >
              <div className="text-right hidden xl:block">
                <p className="text-sm font-bold text-slate-700 leading-none">{displayName}</p>
              </div>
              <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md ring-2 ring-white">
                {initial}
              </div>
              <div className="w-6 h-6 bg-slate-200 rounded-full flex items-center justify-center lg:hidden">
                <ChevronDown size={14} className="text-slate-500" />
              </div>
            </button>

            {/* Dropdown */}
            {showUserMenu && (
              <div className="absolute right-0 top-full mt-3 w-72 bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 p-2 z-50 animate-in fade-in zoom-in-95 duration-200 origin-top-right ring-1 ring-black/5">

                {/* User Info Header inside Dropdown */}
                <div className="mx-2 mt-2 p-3 bg-slate-50/80 rounded-xl mb-2 flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-primary-600 font-bold text-lg shadow-sm">
                    {initial}
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-sm font-bold text-slate-900 truncate">{displayName}</p>
                    <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                  </div>
                </div>

                <div className="space-y-1">
                  <button
                    onClick={goToProfile}
                    className="flex items-center gap-3 w-full px-3 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-white rounded-xl transition-all"
                  >
                    <User size={18} className="text-slate-400" />
                    <span>Mi Perfil</span>
                  </button>

                  <button
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center gap-3 w-full px-3 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-white rounded-xl transition-all"
                  >
                    <Settings size={18} className="text-slate-400" />
                    <span>Configuración</span>
                  </button>

                  <div className="my-1 border-t border-slate-100/50 mx-2" />

                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 w-full px-3 py-2.5 text-sm font-medium text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xl transition-all"
                  >
                    <LogOut size={18} className="text-red-400 group-hover:text-red-500" />
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