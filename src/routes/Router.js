import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from '../pages/Home';
import Teams from '../pages/Teams';
import Schedule from '../pages/Schedule';
import Table from '../pages/Table';
// import Stats from '../pages/Stats';
// import Sanctions from '../pages/Sanctions';
import TeamDetails from '../pages/TeamDetails';
import AdminPanel from '../components/admin_panel/AdminPanel';
import Login from '../components/admin_panel/Login';
import ProtectedRoute from '../components/admin_panel/ProtectedRoute';
import PlayerManagement from '../components/admin_panel/PlayerManagement';

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Home />} />
      <Route path="/teams" element={<Teams />} />
      <Route path="/schedule" element={<Schedule />} />
      <Route path="/table" element={<Table />} />
      {/* <Route path="/stats" element={<Stats />} />
      <Route path="/sanctions" element={<Sanctions />} /> */}
      <Route path="/teams/:teamId" element={<TeamDetails />} />
      <Route path="/login" element={<Login />} />

      {/* Protected admin routes */}
      <Route path="/admin" element={<ProtectedRoute />}>
        <Route index element={<AdminPanel />} />
        <Route path="/admin/players" element={<PlayerManagement />} />
        {/* Add other admin routes here, for example:
        <Route path="players" element={<PlayerManagement />} />
        <Route path="teams" element={<TeamManagement />} />
        <Route path="schedule" element={<ScheduleManagement />} />
        <Route path="matches" element={<MatchManagement />} />
        <Route path="stats" element={<StatsManagement />} />
        <Route path="sanctions" element={<SanctionsManagement />} /> */}
      </Route>
    </Routes>
  );
};

export default AppRoutes;