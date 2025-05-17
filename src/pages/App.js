import React from 'react';
import { BrowserRouter as Router, useLocation } from 'react-router-dom';
import Navbar from '../components/layout/navbar';
import Footer from '../components/layout/footer';
import '../styles/App.css';
import AppRoutes from '../routes/Router';
import { Toaster } from 'react-hot-toast';

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
        <Toaster
          position="top-right"
          toastOptions={{
            className: 'text-sm',
            duration: 3000,
            success: {
              duration: 3000,
              style: {
                background: '#10B981',
                color: 'white',
              },
            },
            error: {
              duration: 5000,
              style: {
                background: '#EF4444',
                color: 'white',
              },
            },
            loading: {
              duration: 10000,
              style: {
                background: '#3B82F6',
                color: 'white',
              },
            },
          }}
        />
      </div>
    </Router>
  );
}

export default App;