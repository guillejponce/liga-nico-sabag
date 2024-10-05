import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Teams from './pages/Teams';
import Schedule from './pages/Schedule';
import Table from './pages/Table';
import Stats from './pages/Stats';
import Sanctions from './pages/Sanctions';
import TeamDetails from './pages/TeamDetails';

const Router = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/teams" element={<Teams />} />
      <Route path="/teams/:teamId" element={<TeamDetails />} />
      <Route path="/schedule" element={<Schedule />} />
      <Route path="/table" element={<Table />} />
      <Route path="/stats" element={<Stats />} />
      <Route path="/sanctions" element={<Sanctions />} />
    </Routes>
  );
};

export default Router;