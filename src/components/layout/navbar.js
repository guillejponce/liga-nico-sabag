import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import logo from '../../assets/images/liga_nico_sabag_blue_logo.png';

const Navbar = () => {
  const [isTransparent, setIsTransparent] = useState(true);
  const location = useLocation();

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
    };
  }, [location]);

  const isHome = location.pathname === '/';

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      isTransparent && isHome ? 'bg-transparent' : 'bg-navbar shadow-lg'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0">
              <img className="h-8 w-8 object-contain" src={logo} alt="Nico Sabag League Logo" />
            </Link>
            <h1 className={`ml-3 text-lg font-semibold ${
              isTransparent && isHome ? 'text-white' : 'text-text-light'
            }`}>Liga Nico Sabag</h1>
          </div>
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              {[
                { name: 'Inicio', path: '/' },
                { name: 'Equipos', path: '/teams' },
                { name: 'Fixture', path: '/schedule' },
                { name: 'Posiciones', path: '/table' },
                { name: 'Estadísticas', path: '/stats' },
                { name: 'Tribunal', path: '/sanctions' },
              ].map((item) => (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition duration-150 ease-in-out ${
                    isTransparent && isHome
                      ? 'text-white hover:bg-white hover:bg-opacity-20 hover:text-white'
                      : 'text-text-light hover:bg-navbar-hover hover:text-white'
                  }`}
                >
                  {item.name}
                </Link>
              ))}
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