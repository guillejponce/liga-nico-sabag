import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import logo from '../../assets/images/liga_nico_sabag_blue_logo.png';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const navItems = [
    { to: '/', label: 'Inicio' },
    { to: '/teams', label: 'Equipos' },
    { to: '/schedule', label: 'Fixture' },
    { to: '/table', label: 'Posiciones' },
    { to: '/stats', label: 'Estadísticas' },
    { to: '/sanctions', label: 'Tribunal' },
    { to: '/admin', label: 'Admin Login' },
  ];

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
              {navItems.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className="text-text-light hover:bg-navbar-hover hover:text-white px-3 py-2 rounded-md text-sm font-medium transition duration-150 ease-in-out"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
          <div className="md:hidden">
            <button
              onClick={toggleMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-text-light hover:text-white hover:bg-navbar-hover focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="text-text-light hover:bg-navbar-hover hover:text-white block px-3 py-2 rounded-md text-base font-medium"
                onClick={toggleMenu}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;