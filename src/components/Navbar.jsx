import React from 'react';
import { Link } from 'react-router-dom';

const Navbar = () => {
  return (
    <nav className="navbar">
      <div className="nav-container">
        <div className="nav-logo">
          <Link to="/">🚌 App Recorridos</Link>
        </div>
        <ul className="nav-menu">
          <li>
            <Link to="/">Dashboard</Link>
          </li>
          <li>
            <Link to="/recorridos">Recorridos</Link>
          </li>
          <li>
            <Link to="/ninos">Niños</Link>
          </li>
          <li>
            <Link to="/vehiculos">Vehículos</Link>
          </li>
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;
