import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Home,
  Users,
  Car,
  MapPin,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  X
} from 'lucide-react';
import { useState, useEffect } from 'react';

const Sidebar = ({ isOpen, onClose, isAdmin, isMobile }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  // Auto-colapsar en móvil
  useEffect(() => {
    if (isMobile) {
      setCollapsed(false);
    }
  }, [isMobile]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    {
      icon: Home,
      label: 'Dashboard',
      path: '/dashboard',
      description: 'Resumen general'
    },
    {
      icon: MapPin,
      label: 'Recorridos',
      path: '/recorridos',
      description: 'Gestión de rutas'
    },
    {
      icon: Users,
      label: 'Niños',
      path: '/ninos',
      description: 'Gestión de estudiantes'
    },
    {
      icon: Car,
      label: 'Vehículos',
      path: '/vehiculos',
      description: 'Flota de transporte'
    },
  ];

  if (isAdmin) {
    menuItems.push({
      icon: Settings,
      label: 'Administración',
      path: '/users',
      description: 'Gestión de usuarios',
      badge: 'Admin'
    });
  }

  return (
    <>
      {/* Overlay para móvil */}
      {isOpen && isMobile && (
        <div
          className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm z-40 lg:hidden transition-all duration-300"
          onClick={onClose}
        />
      )}

      {/* Sidebar - FLOATING MODE */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 lg:z-30
        lg:m-4 lg:rounded-[2.5rem]
        glass-sidebar
        transform transition-all duration-500 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        ${collapsed && !isMobile ? 'lg:w-24' : 'lg:w-80'}
        ${isMobile ? 'w-full h-full rounded-none inset-0 p-4' : 'h-[calc(100vh-2rem)]'}
        flex flex-col
        overflow-hidden
        border border-white/10
      `}>

        {/* Header */}
        <div className={`flex-shrink-0 ${collapsed && !isMobile ? 'px-4 py-5' : 'px-6 py-5'} border-b border-white/10`}>
          <div className="flex items-center justify-between">
            {/* Solo texto del nombre - SIN LOGO */}
            {(!collapsed || isMobile) ? (
              <div className="flex flex-col">
                <h2 className="text-2xl font-black text-white tracking-tighter">Recorridos</h2>
                <p className="text-[10px] text-white/30 font-black uppercase tracking-widest leading-none">Management System</p>
              </div>
            ) : (
              <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-2xl border border-white/20 mx-auto transition-all hover:bg-white/20">
                <span className="text-white font-black text-sm tracking-tighter">RA</span>
              </div>
            )}

            {/* Botones de control */}
            <div className="flex items-center space-x-1">
              {/* Botón cerrar en móvil */}
              {isMobile && (
                <button
                  onClick={onClose}
                  className="lg:hidden p-2 text-white/40 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200"
                >
                  <X size={18} />
                </button>
              )}

              {/* Botón colapsar en desktop */}
              {!isMobile && (
                <button
                  onClick={() => setCollapsed(!collapsed)}
                  className="hidden lg:flex p-2 text-white/40 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200"
                >
                  {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Navegación */}
        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-2 px-4">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path ||
                (item.path === '/dashboard' && location.pathname === '/');

              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    onClick={() => {
                      if (isMobile) {
                        onClose();
                      }
                    }}
                    className={`
                      group relative flex items-center rounded-2xl transition-all duration-200
                      ${isActive
                        ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/25'
                        : 'text-white/70 hover:bg-white/10 hover:text-white hover:shadow-xl'
                      }
                      ${(collapsed && !isMobile) ? 'justify-center p-3' : 'space-x-4 px-4 py-3'}
                      overflow-hidden
                    `}
                  >
                    <div className={`absolute inset-0 bg-gradient-to-r from-white/10 to-white/5 ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                      } transition-opacity duration-200`} />

                    <Icon
                      size={20}
                      className={`relative z-10 flex-shrink-0 ${isActive ? 'text-white' : 'text-white/40 group-hover:text-white'
                        } transition-colors duration-200`}
                    />

                    {(!collapsed || isMobile) && (
                      <div className="relative z-10 flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-black uppercase tracking-widest">{item.label}</span>
                          {item.badge && (
                            <span className="bg-amber-400/20 text-amber-400 text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest border border-amber-400/20">
                              {item.badge}
                            </span>
                          )}
                        </div>
                        <p className={`text-[10px] mt-0.5 truncate uppercase tracking-widest font-bold ${isActive ? 'text-white/80' : 'text-white/30 group-hover:text-white/60'
                          }`}>
                          {item.description}
                        </p>
                      </div>
                    )}

                    {isActive && (!collapsed || isMobile) && (
                      <div className="absolute right-3 w-2 h-2 bg-white rounded-full" />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer - SOLO LOGOUT */}
        <div className={`flex-shrink-0 p-6 border-t border-white/5 bg-white/5 ${(collapsed && !isMobile) ? 'text-center' : ''}`}>
          <button
            onClick={handleLogout}
            className={`
              group flex items-center rounded-2xl transition-all duration-200
              text-white/70 hover:bg-red-400/10 hover:text-red-400 w-full
              ${(collapsed && !isMobile) ? 'justify-center p-3' : 'space-x-4 px-5 py-4'}
              relative overflow-hidden border border-transparent hover:border-red-400/20
            `}
          >
            <LogOut
              size={18}
              className="relative z-10 flex-shrink-0 text-white/30 group-hover:text-red-400 transition-colors duration-200"
            />
            {(!collapsed || isMobile) && (
              <span className="relative z-10 font-black text-[10px] uppercase tracking-widest">Cerrar sesión</span>
            )}
          </button>

          {/* Información de versión */}
          {(!collapsed || isMobile) && (
            <div className="mt-8 text-center">
              <div className="text-[10px] text-white/20 font-black uppercase tracking-widest">
                v3.1.3
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;