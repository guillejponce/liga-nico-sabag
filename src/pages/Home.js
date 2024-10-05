import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
  // Dummy data for latest news and featured match
  const latestNews = [
    { id: 1, title: 'Nuevo récord de goles en la liga', date: '2024-10-01' },
    { id: 2, title: 'Equipo revelación lidera la tabla', date: '2024-09-28' },
    { id: 3, title: 'Próximo torneo anunciado para diciembre', date: '2024-09-25' },
  ];

  const featuredMatch = {
    team1: 'Los Tigres',
    team2: 'Águilas FC',
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
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-center mb-8 text-text">Bienvenidos a la Liga Nico Sabag</h1>
        
        <section className="mb-12">
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

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4 text-text">Próximo Partido Destacado</h2>
          <div className="bg-body p-6 rounded shadow text-center">
            <p className="text-xl mb-2 text-text">{featuredMatch.team1} vs {featuredMatch.team2}</p>
            <p className="text-text-dark">{featuredMatch.date} - {featuredMatch.time}</p>
            <Link to="/schedule" className="mt-4 inline-block bg-accent text-white px-4 py-2 rounded hover:bg-accent-dark transition duration-300">
              Ver Fixture Completo
            </Link>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4 text-text">Accesos Rápidos</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <Link to="/table" className="bg-accent text-white p-4 rounded text-center hover:bg-accent-dark transition duration-300">Tabla de Posiciones</Link>
            <Link to="/stats" className="bg-accent-light text-white p-4 rounded text-center hover:bg-accent transition duration-300">Estadísticas</Link>
            <Link to="/teams" className="bg-accent-dark text-white p-4 rounded text-center hover:bg-accent transition duration-300">Equipos</Link>
          </div>
        </section>

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