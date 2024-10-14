import React, { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { Users, Shirt, Calendar, Trophy, BarChart2, Gavel, Menu, X } from 'lucide-react';
import useAuth from '../../hooks/auth/useAuth';

const AdminPanel = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { logout } = useAuth();
  const location = useLocation();

  const navItems = [
    { icon: <Users size={20} />, label: 'Jugadores', path: '/admin/players' },
    { icon: <Shirt size={20} />, label: 'Equipos', path: '/admin/teams' },
    { icon: <Calendar size={20} />, label: 'Fixture', path: '/admin/schedule' },
    { icon: <Trophy size={20} />, label: 'Partidos', path: '/admin/matches' },
    { icon: <BarChart2 size={20} />, label: 'Estadísticas', path: '/admin/stats' },
    { icon: <Gavel size={20} />, label: 'Tribunal', path: '/admin/sanctions' },
  ];

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className={`bg-white shadow-md z-20 fixed inset-y-0 left-0 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:relative lg:translate-x-0 transition duration-200 ease-in-out`}>
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold text-gray-800">Admin Panel</h2>
          <button onClick={toggleSidebar} className="lg:hidden">
            <X size={24} />
          </button>
        </div>
        <nav className="mt-4">
          {navItems.map((item, index) => (
            <Link
              key={index}
              to={item.path}
              className={`flex items-center p-4 text-gray-700 hover:bg-gray-100 ${location.pathname === item.path ? 'bg-gray-100' : ''}`}
            >
              {item.icon}
              <span className="ml-2">{item.label}</span>
            </Link>
          ))}
          <button
            onClick={logout}
            className="flex items-center w-full p-4 text-gray-700 hover:bg-gray-100"
          >
            <span className="ml-2">Cerrar Sesión</span>
          </button>
        </nav>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white shadow-md">
          <div className="flex items-center justify-between p-4">
            <button onClick={toggleSidebar} className="lg:hidden">
              <Menu size={24} />
            </button>
            <h1 className="text-xl font-semibold text-gray-800">
              {navItems.find(item => item.path === location.pathname)?.label || 'Dashboard'}
            </h1>
          </div>
        </header>
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminPanel;