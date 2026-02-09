import React, { useState, useEffect } from 'react';
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

const Sidebar = ({ isOpen, onClose, isAdmin, isMobile, isCollapsed, setIsCollapsed }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  // Auto-colapsar en móvil
  useEffect(() => {
    if (isMobile) {
      setIsCollapsed(false);
    }
  }, [isMobile, setIsCollapsed]);

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

      {/* Sidebar - FLOATING ENTERPRISE MODE */}
      <aside className={`
        fixed inset-y-0 left-0 lg:inset-y-auto lg:top-4 lg:bottom-4 lg:left-4 z-50 lg:z-30
        bg-slate-50
        transform transition-all duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        ${isCollapsed && !isMobile ? 'lg:w-[90px]' : 'lg:w-[320px]'}
        ${isMobile ? 'w-[300px] h-full shadow-2xl' : 'lg:rounded-[2.5rem] lg:shadow-2xl lg:border border-slate-200'}
        flex flex-col
        overflow-hidden
        ${isMobile ? 'border-r border-slate-200' : ''}
      `}>

        {/* Header */}
        <div className={`flex-shrink-0 h-20 flex items-center ${isCollapsed && !isMobile ? 'justify-center' : 'px-6'} border-b border-slate-200/50`}>
          <div className="flex items-center gap-4 overflow-hidden">
            <div className={`
              bg-primary-600 rounded-2xl flex-shrink-0 flex items-center justify-center shadow-lg shadow-primary-600/20 transition-all duration-300
              ${isCollapsed && !isMobile ? 'w-10 h-10' : 'w-10 h-10'}
            `}>
              <span className="text-white font-black text-sm uppercase tracking-tighter">R</span>
            </div>
            {(!isCollapsed || isMobile) && (
              <div className="flex flex-col">
                <h2 className="text-lg font-black text-slate-900 tracking-tighter uppercase leading-none">Recorridos</h2>
                <span className="text-[9px] font-bold text-slate-400 tracking-[0.2em] uppercase mt-1">App v2.0</span>
              </div>
            )}
          </div>
        </div>

        {/* Navegación */}
        <nav className="flex-1 overflow-y-auto py-6">
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
                      group relative flex items-center py-3 rounded-2xl transition-all duration-300
                      ${isActive
                        ? 'bg-primary-50 text-primary-700 shadow-sm ring-1 ring-primary-100'
                        : 'text-slate-500 hover:bg-white hover:text-slate-900 hover:shadow-md hover:shadow-slate-200/50'
                      }
                      ${(isCollapsed && !isMobile) ? 'justify-center px-0 h-12 w-12 mx-auto' : 'px-5 gap-4'}
                    `}
                  >
                    <Icon
                      size={isCollapsed && !isMobile ? 22 : 20}
                      className={`flex-shrink-0 ${isActive ? 'text-primary-600' : 'text-slate-400 group-hover:text-primary-500'} transition-colors duration-300`}
                    />

                    {(!isCollapsed || isMobile) && (
                      <div className="flex-1 min-w-0">
                        <span className={`block text-sm font-bold tracking-tight ${isActive ? 'text-primary-900' : 'group-hover:text-slate-900'}`}>
                          {item.label}
                        </span>
                        <span className="block text-[10px] font-medium text-slate-400 truncate group-hover:text-slate-500 transition-colors">
                          {item.description}
                        </span>
                      </div>
                    )}

                    {isActive && (!isCollapsed || isMobile) && (
                      <div className="w-1.5 h-1.5 bg-primary-500 rounded-full shadow-[0_0_8px_rgba(79,70,229,0.5)]" />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className={`flex-shrink-0 p-5 mt-auto border-t border-slate-200/50`}>


          <button
            onClick={handleLogout}
            className={`
              flex items-center h-12 rounded-2xl transition-all duration-300
              text-slate-400 hover:bg-red-50 hover:text-red-600 hover:shadow-lg hover:shadow-red-500/10 w-full group
              ${(isCollapsed && !isMobile) ? 'justify-center px-0 w-12 mx-auto' : 'px-5 gap-3'}
            `}
          >
            <LogOut
              size={20}
              className="flex-shrink-0 transition-transform duration-300 group-hover:-translate-x-1"
            />
            {(!isCollapsed || isMobile) && (
              <span className="text-xs font-black tracking-wide uppercase">Cerrar Sesión</span>
            )}
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;