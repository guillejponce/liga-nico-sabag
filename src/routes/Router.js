import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from '../pages/Home';
import Teams from '../pages/Teams';
import Schedule from '../pages/Schedule';
import Table from '../pages/Table';
import TeamDetails from '../pages/TeamDetails';
import Login from '../pages/admin/Login';
import AdminDashboard from '../pages/admin/AdminDashboard';
import AdminTeams from '../pages/admin/AdminTeams';
import AdminPlayers from '../pages/admin/AdminPlayers';
import AdminFixtures from '../pages/admin/AdminFixtures';
import AdminSanctions from '../pages/admin/AdminSanctions';
import ProtectedRoute from '../components/admin/ProtectedRoute';

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Home />} />
      <Route path="/teams" element={<Teams />} />
      <Route path="/schedule" element={<Schedule />} />
      <Route path="/table" element={<Table />} />
      <Route path="/teams/:teamId" element={<TeamDetails />} />
      <Route path="/admin/login" element={<Login />} />

      {/* Protected admin routes */}
      <Route path="/admin" element={<ProtectedRoute />}>
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="teams" element={<AdminTeams />} />
        <Route path="players" element={<AdminPlayers />} />
        <Route path="fixtures" element={<AdminFixtures />} />
        <Route path="sanctions" element={<AdminSanctions />} />
      </Route>
    </Routes>
  );
};

export default AppRoutes;