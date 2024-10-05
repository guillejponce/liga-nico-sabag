import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import Navbar from '../components/layout/navbar';
import Footer from '../components/layout/footer';
import '../styles/App.css';
import AppRoutes from '../routes/Router';

function App() {
  return (
    <Router>
      <Navbar />
      <AppRoutes />
      <Footer />
    </Router>
  );
}

export default App;
