import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
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
import AdminTeamOfTheWeek from '../pages/admin/AdminTeamOfTheWeek';
import AdminBanners from '../pages/admin/AdminBanners';
import AdminEditions from '../pages/admin/AdminEditions';
import ProtectedRoute from '../components/admin/ProtectedRoute';
import PlayerStatistics from '../pages/PlayerStatistics';
import Editions from '../pages/Editions';
import HistoricalTable from '../pages/HistoricalTable';

const Router = () => {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Home />} />
      <Route path="/teams" element={<Teams />} />
      <Route path="/schedule" element={<Schedule />} />
      <Route path="/table" element={<Table />} />
      <Route path="/stats" element={<PlayerStatistics />} />
      <Route path="/teams/:teamId" element={<TeamDetails />} />
      <Route path="/admin/login" element={<Login />} />
      <Route path="/editions" element={<Editions />} />
      <Route path="/historical-table" element={<HistoricalTable />} />

      {/* Protected admin routes */}
      <Route element={<ProtectedRoute />}>
        <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/teams" element={<AdminTeams />} />
        <Route path="/admin/players" element={<AdminPlayers />} />
        <Route path="/admin/fixtures" element={<AdminFixtures />} />
        <Route path="/admin/team-of-week" element={<AdminTeamOfTheWeek />} />
        <Route path="/admin/sanctions" element={<AdminSanctions />} />
        <Route path="/admin/banners" element={<AdminBanners />} />
        <Route path="/admin/editions" element={<AdminEditions />} />
      </Route>
    </Routes>
  );
};

export default Router;