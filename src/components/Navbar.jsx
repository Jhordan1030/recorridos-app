// src/components/Navbar.jsx
import { Link, useLocation } from 'react-router-dom';

const Navbar = () => {
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path ? 'active' : '';
  };

  return (
    <nav className="navbar">
      <div className="nav-container">
        <h1 className="nav-logo">🚌 App Recorridos</h1>
        <ul className="nav-menu">
          <li>
            <Link to="/" className={isActive('/')}>
              📊 Dashboard
            </Link>
          </li>
          <li>
            <Link to="/recorridos" className={isActive('/recorridos')}>
              📍 Recorridos
            </Link>
          </li>
          <li>
            <Link to="/ninos" className={isActive('/ninos')}>
              👦 Niños
            </Link>
          </li>
          <li>
            <Link to="/vehiculos" className={isActive('/vehiculos')}>
              🚗 Vehículos
            </Link>
          </li>
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;