import React from 'react';
import { Link } from 'react-router-dom';
import logo from '../../assets/images/liga_nico_sabag_blue_logo.png';

const Navbar = () => {
  return (
    <nav className="bg-navbar shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0">
              <img className="h-8 w-8 object-contain" src={logo} alt="Nico Sabag League Logo" />
            </Link>
            <h1 className="ml-3 text-text-light text-lg font-semibold">Liga Nico Sabag</h1>
          </div>
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              <Link to="/" className="text-text-light hover:bg-navbar-hover hover:text-white px-3 py-2 rounded-md text-sm font-medium transition duration-150 ease-in-out">Inicio</Link>
              <Link to="/teams" className="text-text-light hover:bg-navbar-hover hover:text-white px-3 py-2 rounded-md text-sm font-medium transition duration-150 ease-in-out">Equipos</Link>
              <Link to="/schedule" className="text-text-light hover:bg-navbar-hover hover:text-white px-3 py-2 rounded-md text-sm font-medium transition duration-150 ease-in-out">Fixture</Link>
            </div>
          </div>
          <div className="md:hidden">
            {/* Aquí iría el código para el menú móvil */}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;