import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, User } from 'lucide-react';
import logo from '../../assets/images/liga_nico_sabag_blue_logo.png';
import useAuth from '../../hooks/auth/useAuth';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isTransparent, setIsTransparent] = useState(true);
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      const isTop = window.scrollY < 100;
      setIsTransparent(isTop && location.pathname === '/');
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Call once to set initial state

    return () => window.removeEventListener('scroll', handleScroll);
  }, [location]);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const handleLoginClick = () => {
    navigate('/login');
  };

  const handleLogoutClick = async () => {
    await logout();
    navigate('/');
  };

  const navItems = [
    { to: '/', label: 'Inicio' },
    { to: '/teams', label: 'Equipos' },
    { to: '/schedule', label: 'Fixture' },
    { to: '/table', label: 'Posiciones' },
    { to: '/stats', label: 'Estadísticas' },
    { to: '/sanctions', label: 'Tribunal' },
  ];

  const navbarClasses = `fixed w-full z-50 transition-all duration-300 ${
    isTransparent ? 'bg-transparent' : 'bg-navbar shadow-lg'
  }`;

  const linkClasses = `${
    isTransparent ? 'text-white' : 'text-text-light'
  } hover:bg-navbar-hover hover:text-white px-3 py-2 rounded-md text-sm font-medium transition duration-150 ease-in-out`;

  return (
    <nav className={navbarClasses}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0">
              <img className="h-8 w-8 object-contain" src={logo} alt="Nico Sabag League Logo" />
            </Link>
            <h1 className={`ml-3 text-lg font-semibold ${isTransparent ? 'text-white' : 'text-text-light'}`}>
              Liga Nico Sabag
            </h1>
          </div>
          <div className="hidden md:block">
            <div className="ml-10 flex items-center space-x-4">
              {navItems.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className={linkClasses}
                >
                  {item.label}
                </Link>
              ))}
              {user ? (
                <>
                  {isAdmin && (
                    <Link
                      to="/admin"
                      className={linkClasses}
                    >
                      Admin Panel
                    </Link>
                  )}
                  <button
                    onClick={handleLogoutClick}
                    className={linkClasses}
                  >
                    Logout
                  </button>
                </>
              ) : (
                <button
                  onClick={handleLoginClick}
                  className={linkClasses}
                >
                  <User className="inline-block mr-1 h-4 w-4" />
                  Administrador
                </button>
              )}
            </div>
          </div>
          <div className="md:hidden">
            <button
              onClick={toggleMenu}
              className={`inline-flex items-center justify-center p-2 rounded-md ${
                isTransparent ? 'text-white' : 'text-text-light'
              } hover:text-white hover:bg-navbar-hover focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white`}
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-navbar">
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
            {user ? (
              <>
                {isAdmin && (
                  <Link
                    to="/admin"
                    className="text-text-light hover:bg-navbar-hover hover:text-white block px-3 py-2 rounded-md text-base font-medium"
                    onClick={toggleMenu}
                  >
                    Admin Panel
                  </Link>
                )}
                <button
                  onClick={handleLogoutClick}
                  className="text-text-light hover:bg-navbar-hover hover:text-white block px-3 py-2 rounded-md text-base font-medium w-full text-left"
                >
                  Logout
                </button>
              </>
            ) : (
              <button
                onClick={handleLoginClick}
                className="text-text-light hover:bg-navbar-hover hover:text-white block px-3 py-2 rounded-md text-base font-medium w-full text-left"
              >
                <User className="inline-block mr-1 h-4 w-4" />
                Administrador
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;