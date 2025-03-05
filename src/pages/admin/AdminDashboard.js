import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { pb } from '../../config';
import { Users, Calendar, Shield, LogOut, User, Database, Trophy, Image, Grid } from 'lucide-react';

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

  const dashboardItems = [
    { icon: Users, label: 'Manage Teams', path: '/admin/teams', color: 'bg-green-500' },
    { icon: User, label: 'Manage Players', path: '/admin/players', color: 'bg-yellow-500' },
    { icon: Calendar, label: 'Manage Fixtures', path: '/admin/fixtures', color: 'bg-purple-500' },
    { icon: Trophy, label: 'Team of the Week', path: '/admin/team-of-week', color: 'bg-orange-500' },
    { icon: Shield, label: 'Manage Sanctions', path: '/admin/sanctions', color: 'bg-indigo-500' },
    { icon: Grid, label: 'Manage Groups', path: '/admin/groups', color: 'bg-blue-500' },
    { icon: Database, label: 'Database Admin', path: 'https://api.liganicosabag.me/_/', color: 'bg-gray-700', external: true },
    { icon: Image, label: 'Manage Banners', path: '/admin/banners', color: 'bg-pink-500' },
    { icon: Trophy, label: 'Manage Editions', path: '/admin/editions', color: 'bg-purple-600' },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            </div>
            <div className="flex items-center">
              <span className="text-gray-700 mr-4">Welcome, {user?.email}</span>
              <button
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded flex items-center"
              >
                <LogOut className="mr-2 h-5 w-5" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h2 className="text-3xl font-semibold text-gray-900 mb-6">Admin Controls</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {dashboardItems.map((item, index) => (
              item.external ? (
                <a
                  key={index}
                  href={item.path}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${item.color} hover:opacity-90 text-white rounded-lg shadow-md overflow-hidden`}
                >
                  <div className="p-5 flex items-center">
                    <item.icon className="h-10 w-10 mr-3" />
                    <div>
                      <p className="text-xl font-semibold">{item.label}</p>
                      <p className="text-sm opacity-80">Opens in new tab</p>
                    </div>
                  </div>
                </a>
              ) : (
                <Link
                  key={index}
                  to={item.path}
                  className={`${item.color} hover:opacity-90 text-white rounded-lg shadow-md overflow-hidden`}
                >
                  <div className="p-5 flex items-center">
                    <item.icon className="h-10 w-10 mr-3" />
                    <div>
                      <p className="text-xl font-semibold">{item.label}</p>
                      <p className="text-sm opacity-80">Click to manage</p>
                    </div>
                  </div>
                </Link>
              )
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;