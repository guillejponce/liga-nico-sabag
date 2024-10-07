import React from 'react';
import { BrowserRouter as Router, useLocation } from 'react-router-dom';
import Navbar from '../components/layout/navbar';
import Footer from '../components/layout/footer';
import '../styles/App.css';
import AppRoutes from '../routes/Router';

function MainContent() {
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  return (
    <main className={`flex-grow ${isHomePage ? '' : 'pt-16'}`}>
      <AppRoutes />
    </main>
  );
}

function App() {
  return (
    <Router>
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <MainContent />
        <Footer />
      </div>
    </Router>
  );
}

export default App;