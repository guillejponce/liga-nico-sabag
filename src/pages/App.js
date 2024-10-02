import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import Navbar from '../components/layout/navbar';
import Footer from '../components/layout/footer';
import logo from '../assets/images/logo.svg';
import '../styles/App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Navbar />
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <p>
            Edit <code>src/App.js</code> and save to reload.
          </p>
          <a
            className="App-link"
            href="https://reactjs.org"
            target="_blank"
            rel="noopener noreferrer"
          >
            Learn React
          </a>
        </header>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
