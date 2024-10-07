import React from 'react';
import { Link } from 'react-router-dom';
import backgroundImage from '../assets/images/homepage/landing.jpg';

const Home = () => {
  const latestNews = [
    { id: 1, title: 'Nuevo récord de goles en la liga', date: '2024-10-01' },
    { id: 2, title: 'Equipo revelación lidera la tabla', date: '2024-09-28' },
    { id: 3, title: 'Próximo torneo anunciado para diciembre', date: '2024-09-25' },
  ];

  const featuredMatch = {
    team1: 'Ivory Toast',
    team2: 'Ingestionables FC',
    date: '2024-10-10',
    time: '20:00',
  };

  const sponsors = [
    { id: 1, name: 'Sponsor 1', logo: '/path/to/sponsor1-logo.png' },
    { id: 2, name: 'Sponsor 2', logo: '/path/to/sponsor2-logo.png' },
    { id: 3, name: 'Sponsor 3', logo: '/path/to/sponsor3-logo.png' },
  ];

  return (
    <div className="bg-body-secondary min-h-screen">
      {/* 3/4 screen height photo background with bottom alignment */}
      <div 
        className="w-full h-[75vh] bg-cover bg-bottom flex items-center justify-center relative overflow-hidden"
        style={{ backgroundImage: `url(${backgroundImage})` }}
      >
        <div className="absolute inset-0 bg-black bg-opacity-40"></div>
        <div className="text-center text-white p-8 rounded relative z-10">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">Bienvenidos a la Liga Nico Sabag</h1>
          <p className="text-lg md:text-xl lg:text-2xl">Donde la pasión por el fútbol se une con la competencia amistosa</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Two-column layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {/* Latest News Column */}
          <section>
            <h2 className="text-2xl font-semibold mb-4 text-text">Últimas Noticias</h2>
            <ul className="space-y-2">
              {latestNews.map((news) => (
                <li key={news.id} className="bg-body p-4 rounded shadow">
                  <h3 className="font-medium text-text">{news.title}</h3>
                  <p className="text-sm text-text-dark">{news.date}</p>
                </li>
              ))}
            </ul>
          </section>

          {/* Featured Match Column */}
          <section>
            <h2 className="text-2xl font-semibold mb-4 text-text">Próximo Partido Destacado</h2>
            <div className="bg-body p-6 rounded shadow text-center">
              <p className="text-xl mb-2 text-text">{featuredMatch.team1} vs {featuredMatch.team2}</p>
              <p className="text-text-dark">{featuredMatch.date} - {featuredMatch.time}</p>
              <Link to="/schedule" className="mt-4 inline-block bg-accent text-white px-4 py-2 rounded hover:bg-accent-dark transition duration-300">
                Ver Fixture Completo
              </Link>
            </div>
          </section>
        </div>

        {/* Quick Access Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4 text-text">Accesos Rápidos</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <Link to="/table" className="bg-accent text-white p-4 rounded text-center hover:bg-accent-dark transition duration-300">Tabla de Posiciones</Link>
            <Link to="/stats" className="bg-accent text-white p-4 rounded text-center hover:bg-accent-dark transition duration-300">Estadísticas</Link>
            <Link to="/teams" className="bg-accent text-white p-4 rounded text-center hover:bg-accent-dark transition duration-300">Equipos</Link>
          </div>
        </section>

        {/* Sponsors Section */}
        <section>
          <h2 className="text-2xl font-semibold mb-4 text-text">Nuestros Patrocinadores</h2>
          <div className="flex flex-wrap justify-center gap-8">
            {sponsors.map((sponsor) => (
              <div key={sponsor.id} className="text-center">
                <img src={sponsor.logo} alt={sponsor.name} className="h-16 w-16 object-contain mx-auto" />
                <p className="mt-2 text-text-dark">{sponsor.name}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Home;