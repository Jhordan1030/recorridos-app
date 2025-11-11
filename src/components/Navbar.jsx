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

  // Clases CSS base
  const linkBaseClass = "flex items-center p-3 text-sm font-semibold transition-colors duration-200 rounded-lg mx-2";
  const linkActiveClass = "bg-white/90 text-indigo-800 shadow-lg"; 
  const linkInactiveClass = "text-gray-200 hover:bg-white/20 hover:text-white";
  const sidebarBaseClasses = "w-64 bg-indigo-700 h-screen py-4 space-y-2 z-40 bg-gradient-to-br from-indigo-800 to-purple-700";

  // Contenido de la navegación (compartido entre sidebar fijo y modal móvil)
  const menuContent = (
    <div className="flex flex-col space-y-1">
      {/* Información del usuario */}
      <div className="mx-2 p-3 bg-white/10 rounded-lg mb-2">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white font-medium text-sm truncate">
              {user?.nombre || 'Usuario'}
            </p>
            <p className="text-gray-300 text-xs truncate">
              {user?.email}
            </p>
          </div>
          {/* ✅ NUEVO: Badge de rol */}
          <span className={`px-2 py-1 text-xs font-bold rounded-full ${
            user?.rol === 'admin' 
              ? 'bg-yellow-100 text-yellow-800' 
              : 'bg-green-100 text-green-800'
          }`}>
            {user?.rol || 'usuario'}
          </span>
        </div>
      </div>

      {/* Dashboard */}
      <Link
        onClick={onClose} 
        to="/dashboard"
        className={`${linkBaseClass} ${location.pathname.includes('/dashboard') || location.pathname === '/' ? linkActiveClass : linkInactiveClass}`}
      >
        <span className="mr-3">🏠</span> Dashboard
      </Link>

      {/* Recorridos */}
      <Link
        onClick={onClose}
        to="/recorridos"
        className={`${linkBaseClass} ${location.pathname.includes('/recorridos') ? linkActiveClass : linkInactiveClass}`}
      >
        <span className="mr-3">🗺️</span> Recorridos
      </Link>

      {/* Niños */}
      <Link
        onClick={onClose}
        to="/ninos"
        className={`${linkBaseClass} ${location.pathname.includes('/ninos') ? linkActiveClass : linkInactiveClass}`}
      >
        <span className="mr-3">👶</span> Niños
      </Link>

      {/* Vehículos */}
      <Link
        onClick={onClose}
        to="/vehiculos"
        className={`${linkBaseClass} ${location.pathname.includes('/vehiculos') ? linkActiveClass : linkInactiveClass}`}
      >
        <span className="mr-3">🚗</span> Vehículos
      </Link>

      {/* ✅ NUEVO: Gestión de Usuarios (Solo para Admin) */}
      {isAdmin && (
        <Link
          onClick={onClose}
          to="/users"
          className={`${linkBaseClass} ${location.pathname.includes('/users') ? linkActiveClass : linkInactiveClass}`}
        >
          <span className="mr-3">👥</span> Gestión de Usuarios
        </Link>
      )}

      {/* Separador */}
      <div className="mx-2 my-2 border-t border-white/20"></div>

      {/* Cerrar sesión */}
      <button
        onClick={handleLogout}
        className="flex items-center p-3 text-sm font-semibold transition-colors duration-200 rounded-lg mx-2 mt-2 bg-white/20 text-red-100 hover:bg-red-600 hover:text-white"
      >
        <span className="mr-3">🚪</span> Cerrar sesión
      </button>

      {/* ✅ NUEVO: Información de rol en el footer del sidebar */}
      <div className="mx-2 mt-4 p-2 bg-white/5 rounded-lg">
        <p className="text-gray-300 text-xs text-center">
          {isAdmin ? '🔧 Modo Administrador' : '👤 Modo Usuario'}
        </p>
      </div>
    </div>
  );

  return (
    <>
      {/* ---------------------------------------------------- */}
      {/* 1. Sidebar Fijo (Solo visible en tablet/desktop) */}
      {/* ---------------------------------------------------- */}
      <nav className={`hidden md:flex md:flex-col ${sidebarBaseClasses} fixed`}>
        {/* Título/Logo */}
        <div className="flex items-center h-16 mb-4 px-4 border-b border-white/20">
          <h1 className="text-xl font-extrabold text-white tracking-wider">
            <span className="mr-2">🚌</span> App Recorridos
          </h1>
          {/* ✅ NUEVO: Badge de admin en el header */}
          {isAdmin && (
            <span className="ml-2 px-2 py-1 bg-yellow-500 text-white text-xs font-bold rounded">
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
        <div
          className="fixed inset-0 z-50 transition-opacity md:hidden bg-gray-900/50"
          aria-modal="true"
          onClick={onClose} 
        >
          {/* Panel del Menú */}
          <div 
            className={`fixed inset-y-0 left-0 ${sidebarBaseClasses} shadow-xl overflow-y-auto transform transition-transform ease-in-out duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
            onClick={(e) => e.stopPropagation()} 
          >
            {/* Encabezado del Menú Móvil */}
            <div className="flex items-center justify-between h-16 mb-4 px-4 border-b border-white/20">
              <div className="flex items-center">
                <h1 className="text-xl font-extrabold text-white tracking-wider">
                  <span className="mr-2">🚌</span> Menú
                </h1>
                {/* ✅ NUEVO: Badge de admin en móvil */}
                {isAdmin && (
                  <span className="ml-2 px-2 py-1 bg-yellow-500 text-white text-xs font-bold rounded">
                    ADMIN
                  </span>
                )}
              </div>
              <button
                type="button"
                className="text-gray-300 hover:text-white p-1 rounded focus:outline-none focus:ring-2 focus:ring-white"
                onClick={onClose}
                aria-label="Cerrar Menú"
              >
                <span className="text-2xl font-light leading-none">&times;</span>
              </button>
            </div>

            {/* Contenido de la Navegación Móvil */}
            {menuContent}
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;