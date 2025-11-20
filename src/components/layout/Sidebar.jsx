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
      
      {/* Sidebar */}
      <aside className={`
        fixed lg:sticky inset-y-0 left-0 z-50 lg:z-30
        bg-white/95 backdrop-blur-md border-r border-gray-100
        transform transition-all duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        ${collapsed && !isMobile ? 'w-20' : 'w-80'}
        ${isMobile ? 'w-80 shadow-2xl' : 'lg:shadow-lg'}
        flex flex-col
        h-screen
        overflow-hidden
      `}>
        
        {/* Header - SIN LOGO DEL CARRITO */}
        <div className={`flex-shrink-0 ${collapsed && !isMobile ? 'px-4 py-5' : 'px-6 py-5'} border-b border-gray-100 bg-gradient-to-r from-white to-gray-50/50`}>
          <div className="flex items-center justify-between">
            {/* Solo texto del nombre - SIN LOGO */}
            {(!collapsed || isMobile) ? (
              <div className="flex flex-col">
                <h2 className="text-lg font-bold text-gray-900">Recorridos App</h2>
                <p className="text-xs text-gray-500 font-medium">Sistema de transporte</p>
              </div>
            ) : (
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/20 mx-auto">
                <span className="text-white font-bold text-sm">RA</span>
              </div>
            )}
            
            {/* Botones de control */}
            <div className="flex items-center space-x-1">
              {/* Botón cerrar en móvil */}
              {isMobile && (
                <button 
                  onClick={onClose}
                  className="lg:hidden p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-all duration-200"
                >
                  <X size={18} />
                </button>
              )}
              
              {/* Botón colapsar en desktop */}
              {!isMobile && (
                <button 
                  onClick={() => setCollapsed(!collapsed)}
                  className="hidden lg:flex p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-all duration-200"
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
                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900 hover:shadow-md'
                      }
                      ${(collapsed && !isMobile) ? 'justify-center p-3' : 'space-x-4 px-4 py-3'}
                      overflow-hidden
                    `}
                  >
                    <div className={`absolute inset-0 bg-gradient-to-r from-white/10 to-white/5 ${
                      isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                    } transition-opacity duration-200`} />
                    
                    <Icon 
                      size={20} 
                      className={`relative z-10 flex-shrink-0 ${
                        isActive ? 'text-white' : 'text-gray-400 group-hover:text-primary-500'
                      } transition-colors duration-200`} 
                    />
                    
                    {(!collapsed || isMobile) && (
                      <div className="relative z-10 flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-sm truncate">{item.label}</span>
                          {item.badge && (
                            <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-0.5 rounded-full font-medium">
                              {item.badge}
                            </span>
                          )}
                        </div>
                        <p className={`text-xs mt-0.5 truncate ${
                          isActive ? 'text-primary-100' : 'text-gray-500'
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
        <div className={`flex-shrink-0 p-4 border-t border-gray-100 bg-gray-50/50 ${
          (collapsed && !isMobile) ? 'text-center' : ''
        }`}>
          <button
            onClick={handleLogout}
            className={`
              group flex items-center rounded-2xl transition-all duration-200
              text-gray-600 hover:bg-red-50 hover:text-red-600 w-full
              ${(collapsed && !isMobile) ? 'justify-center p-3' : 'space-x-3 px-4 py-3'}
              relative overflow-hidden
            `}
          >
            <div className="absolute inset-0 bg-red-500/5 group-hover:bg-red-500/10 transition-colors duration-200 rounded-2xl" />
            <LogOut 
              size={20} 
              className="relative z-10 flex-shrink-0 text-gray-400 group-hover:text-red-500 transition-colors duration-200" 
            />
            {(!collapsed || isMobile) && (
              <span className="relative z-10 font-semibold text-sm">Cerrar sesión</span>
            )}
          </button>
          
          {/* Información de versión */}
          {(!collapsed || isMobile) && (
            <div className="mt-4 text-center">
              <div className="text-xs text-gray-500 font-medium">
                v2.1
              </div>
              <div className="text-[10px] text-gray-400 mt-1">
                Sistema de Transporte Escolar
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;