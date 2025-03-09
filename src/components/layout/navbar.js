import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import logo from '../../assets/images/liga_nico_sabag_blue_logo.png';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isTransparent, setIsTransparent] = useState(true);
  const location = useLocation();

  const toggleMenu = () => {
    setIsOpen(!isOpen);
    document.body.classList.toggle('menu-open', !isOpen);
  };

  useEffect(() => {
    const handleScroll = () => {
      const show = window.scrollY > 50;
      if (show) {
        setIsTransparent(false);
      } else {
        setIsTransparent(location.pathname === '/');
      }
    };

    setIsTransparent(location.pathname === '/');
    document.addEventListener('scroll', handleScroll);
    
    return () => {
      document.removeEventListener('scroll', handleScroll);
      document.body.classList.remove('menu-open');
    };
  }, [location.pathname]);

  const isHome = location.pathname === '/';

  const navItems = [
    { to: '/', label: 'Inicio' },
    { to: '/teams', label: 'Equipos' },
    { to: '/schedule', label: 'Fixture' },
    { to: '/table', label: 'Posiciones' },
    { to: '/stats', label: 'Estadísticas' },
    { to: '/editions', label: 'Ediciones' },
    { to: '/rules', label: 'Reglamento' },
    { to: '/admin', label: 'Admin' },
  ];

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      (isTransparent && isHome && !isOpen) ? 'bg-transparent' : 'bg-navbar shadow-lg'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0">
              <img className="h-8 w-8 object-contain" src={logo} alt="Nico Sabag League Logo" />
            </Link>
            <Link to="/">
              <h1 className={`ml-3 text-lg font-semibold ${
                (isTransparent && isHome && !isOpen) ? 'text-white' : 'text-text-light'
              }`}>
                Liga Nico Sabag
              </h1>
            </Link>
          </div>
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              {navItems.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition duration-150 ease-in-out ${
                    isTransparent && isHome && !isOpen
                      ? 'text-white hover:bg-white hover:bg-opacity-20 hover:text-white'
                      : 'text-text-light hover:bg-navbar-hover hover:text-white'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
          <div className="md:hidden">
            <button
              onClick={toggleMenu}
              className={`inline-flex items-center justify-center p-2 rounded-md ${
                isOpen || !isTransparent || !isHome
                  ? 'text-text-light hover:text-white'
                  : 'text-white'
              } hover:bg-navbar-hover focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white`}
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden bg-navbar">
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