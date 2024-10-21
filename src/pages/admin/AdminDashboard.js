import React, { useState, useEffect } from 'react';
import { useNavigate, Link, Outlet } from 'react-router-dom';
import { pb } from '../../config';
import { Users, Calendar, Award, Shield, LogOut, Home } from 'lucide-react';

const AdminDashboard = () => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const loggedInUser = pb.authStore.model;
    if (loggedInUser) {
      setUser(loggedInUser);
    } else {
      navigate('/login');
    }
  }, [navigate]);

  const handleLogout = () => {
    pb.authStore.clear();
    navigate('/login');
  };

  const sidebarItems = [
    { icon: Home, label: 'Dashboard', path: '/admin/dashboard' },
    { icon: Users, label: 'Teams', path: '/admin/teams' },
    { icon: Users, label: 'Players', path: '/admin/players' },
    { icon: Calendar, label: 'Fixtures', path: '/admin/fixtures' },
    { icon: Award, label: 'Results', path: '/admin/results' },
    { icon: Shield, label: 'Sanctions', path: '/admin/sanctions' },
  ];

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-indigo-800 text-white">
        <div className="p-4">
          <h1 className="text-2xl font-semibold">Admin Panel</h1>
        </div>
        <nav className="mt-8">
          {sidebarItems.map((item, index) => (
            <Link
              key={index}
              to={item.path}
              className="flex items-center py-2 px-4 hover:bg-indigo-700 transition-colors duration-200"
            >
              <item.icon className="mr-3 h-5 w-5" />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="absolute bottom-0 w-64 p-4">
          <button
            onClick={handleLogout}
            className="flex items-center text-white hover:text-indigo-200 transition-colors duration-200"
          >
            <LogOut className="mr-3 h-5 w-5" />
            Logout
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-x-hidden overflow-y-auto">
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold text-gray-900">
              Welcome, {user?.email}
            </h1>
          </div>
        </header>
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;