import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Componente Navbar/Sidebar responsivo.
 * @param {object} props
 * @param {boolean} props.isOpen - Indica si el menú está abierto (solo relevante en móvil).
 * @param {function} props.onClose - Función para cerrar el menú (solo relevante en móvil).
 * @param {boolean} props.isAdmin - Indica si el usuario es administrador.
 */
const Navbar = ({ isOpen, onClose, isAdmin }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  // Función para cerrar sesión con nuestro JWT
  const handleLogout = () => {
    logout();
    navigate('/login'); // redirige al login
  };

  // Clases CSS base responsivas
  const linkBaseClass = "flex items-center p-3 text-sm font-semibold transition-colors duration-200 rounded-lg mx-2";
  const linkActiveClass = "bg-white/90 text-indigo-800 shadow-lg"; 
  const linkInactiveClass = "text-gray-200 hover:bg-white/20 hover:text-white";
  
  // Sidebar responsivo - ancho variable por dispositivo
  const sidebarBaseClasses = `
    bg-indigo-700 h-screen py-4 space-y-2 z-40 
    bg-gradient-to-br from-indigo-800 to-purple-700
    w-56 sm:w-60 md:w-64 lg:w-72  /* ✅ RESPONSIVE: Ancho progresivo */
  `;

  // Contenido de la navegación (compartido entre sidebar fijo y modal móvil)
  const menuContent = (
    <div className="flex flex-col space-y-1 h-full">
      {/* Información del usuario - Mejorado para móvil */}
      <div className="mx-2 p-3 bg-white/10 rounded-lg mb-2">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-white font-medium text-sm truncate">
              {user?.nombre || 'Usuario'}
            </p>
            <p className="text-gray-300 text-xs truncate mt-1">
              {user?.email}
            </p>
          </div>
          {/* ✅ Badge de rol responsivo */}
          <span className={`
            px-2 py-1 text-xs font-bold rounded-full flex-shrink-0 ml-2
            ${user?.rol === 'admin' 
              ? 'bg-yellow-100 text-yellow-800' 
              : 'bg-green-100 text-green-800'
            }
          `}>
            {user?.rol === 'admin' ? 'ADMIN' : 'USER'}
          </span>
        </div>
      </div>

      {/* Navegación principal */}
      <div className="flex-1 overflow-y-auto">
        {/* Dashboard */}
        <Link
          onClick={onClose} 
          to="/dashboard"
          className={`${linkBaseClass} ${
            location.pathname.includes('/dashboard') || location.pathname === '/' 
              ? linkActiveClass 
              : linkInactiveClass
          }`}
        >
          <span className="mr-3 text-base">🏠</span> 
          <span className="text-sm sm:text-base">Dashboard</span>
        </Link>

        {/* Recorridos */}
        <Link
          onClick={onClose}
          to="/recorridos"
          className={`${linkBaseClass} ${
            location.pathname.includes('/recorridos') ? linkActiveClass : linkInactiveClass
          }`}
        >
          <span className="mr-3 text-base">🗺️</span>
          <span className="text-sm sm:text-base">Recorridos</span>
        </Link>

        {/* Niños */}
        <Link
          onClick={onClose}
          to="/ninos"
          className={`${linkBaseClass} ${
            location.pathname.includes('/ninos') ? linkActiveClass : linkInactiveClass
          }`}
        >
          <span className="mr-3 text-base">👶</span>
          <span className="text-sm sm:text-base">Niños</span>
        </Link>

        {/* Vehículos */}
        <Link
          onClick={onClose}
          to="/vehiculos"
          className={`${linkBaseClass} ${
            location.pathname.includes('/vehiculos') ? linkActiveClass : linkInactiveClass
          }`}
        >
          <span className="mr-3 text-base">🚗</span>
          <span className="text-sm sm:text-base">Vehículos</span>
        </Link>

        {/* ✅ Gestión de Usuarios (Solo para Admin) */}
        {isAdmin && (
          <Link
            onClick={onClose}
            to="/users"
            className={`${linkBaseClass} ${
              location.pathname.includes('/users') ? linkActiveClass : linkInactiveClass
            }`}
          >
            <span className="mr-3 text-base">👥</span>
            <span className="text-sm sm:text-base">Gestión de Usuarios</span>
          </Link>
        )}
      </div>

      {/* Separador */}
      <div className="mx-2 my-2 border-t border-white/20"></div>

      {/* Footer del sidebar */}
      <div className="space-y-2">
        {/* Cerrar sesión */}
        <button
          onClick={handleLogout}
          className="flex items-center p-3 text-sm font-semibold transition-colors duration-200 rounded-lg mx-2 bg-white/20 text-red-100 hover:bg-red-600 hover:text-white w-[calc(100%-1rem)]"
        >
          <span className="mr-3 text-base">🚪</span>
          <span className="text-sm sm:text-base">Cerrar sesión</span>
        </button>

        {/* ✅ Información de rol en el footer del sidebar */}
        <div className="mx-2 p-2 bg-white/5 rounded-lg">
          <p className="text-gray-300 text-xs text-center">
            {isAdmin ? '🔧 Modo Administrador' : '👤 Modo Usuario'}
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* ---------------------------------------------------- */}
      {/* 1. Sidebar Fijo (Solo visible en tablet/desktop) */}
      {/* ---------------------------------------------------- */}
      <nav className={`
        hidden md:flex md:flex-col ${sidebarBaseClasses} fixed left-0 top-0
        transition-all duration-300
      `}>
        {/* Título/Logo responsivo */}
        <div className="flex items-center h-16 mb-4 px-4 border-b border-white/20">
          <div className="flex items-center space-x-2">
            <span className="text-xl">🚌</span>
            <h1 className="text-lg lg:text-xl font-extrabold text-white tracking-wider truncate">
              App Recorridos
            </h1>
          </div>
          {/* ✅ Badge de admin en el header */}
          {isAdmin && (
            <span className="ml-2 px-2 py-1 bg-yellow-500 text-white text-xs font-bold rounded flex-shrink-0">
              ADMIN
            </span>
          )}
        </div>

        {/* Navegación vertical */}
        {menuContent}
      </nav>

      {/* ---------------------------------------------------- */}
      {/* 2. Menú Móvil Deslizable (Solo visible en móvil/tablet pequeña) */}
      {/* ---------------------------------------------------- */}
      {isOpen && (
        <>
          {/* Overlay con animación */}
          <div
            className="fixed inset-0 z-40 transition-opacity md:hidden bg-gray-900/80 backdrop-blur-sm"
            aria-modal="true"
            onClick={onClose} 
          />
          
          {/* Panel del Menú Móvil */}
          <div 
            className={`
              fixed inset-y-0 left-0 ${sidebarBaseClasses} shadow-2xl 
              transform transition-transform duration-300 ease-in-out md:hidden
              ${isOpen ? 'translate-x-0' : '-translate-x-full'}
              overflow-hidden
            `}
            style={{ zIndex: 50 }}
            onClick={(e) => e.stopPropagation()} 
          >
            {/* Encabezado del Menú Móvil */}
            <div className="flex items-center justify-between h-16 mb-4 px-4 border-b border-white/20">
              <div className="flex items-center space-x-2">
                <span className="text-xl">🚌</span>
                <h1 className="text-lg font-extrabold text-white tracking-wider">
                  Menú
                </h1>
                {/* ✅ Badge de admin en móvil */}
                {isAdmin && (
                  <span className="ml-2 px-2 py-1 bg-yellow-500 text-white text-xs font-bold rounded">
                    ADMIN
                  </span>
                )}
              </div>
              <button
                type="button"
                className="text-gray-300 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-white"
                onClick={onClose}
                aria-label="Cerrar Menú"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Contenido de la Navegación Móvil */}
            <div className="h-[calc(100vh-5rem)] overflow-y-auto">
              {menuContent}
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default Navbar;