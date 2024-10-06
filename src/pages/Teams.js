import React from 'react';
import { Link } from 'react-router-dom';
import { Users, Trophy, Star } from 'lucide-react';

// This is a mock data array. In a real application, you'd fetch this data from an API.
const teamsData = [
    { id: 1, name: 'Ivory Toast FC', playerCount: 22, wins: 5, captain: 'Juan Pérez' },
    { id: 2, name: 'Ingestionables FC', playerCount: 20, wins: 4, captain: 'Carlos Rodríguez' },
    { id: 3, name: 'Gotish', playerCount: 21, wins: 6, captain: 'Miguel González' },
    { id: 4, name: 'Al Ziya', playerCount: 23, wins: 3, captain: 'Luis Hernández' },
    { id: 5, name: 'La Monga', playerCount: 22, wins: 5, captain: 'Roberto Sánchez' },
    { id: 6, name: 'Exiliados', playerCount: 20, wins: 4, captain: 'Javier López' },
    { id: 7, name: 'Pincharratas', playerCount: 21, wins: 6, captain: 'Pedro Martínez' },
    { id: 8, name: 'Incus', playerCount: 23, wins: 3, captain: 'Raúl Ramírez' },
    { id: 9, name: 'Marisol FC', playerCount: 22, wins: 5, captain: 'Fernando Gómez' },
    { id: 10, name: 'Semasbros', playerCount: 20, wins: 4, captain: 'Sergio Pérez' },
    { id: 11, name: 'Quiero Volver con mi Ex', playerCount: 21, wins: 6, captain: 'Hugo Sánchez' },
    { id: 12, name: 'Turbines FC', playerCount: 23, wins: 3, captain: 'Jorge González' },
    { id: 13, name: 'Masterclass', playerCount: 22, wins: 5, captain: 'Mario Hernández' },

  // Add more teams as needed to reach approximately 14 teams
];

const Teams = () => {
  // Sort teams alphabetically by name
  const sortedTeams = [...teamsData].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="bg-body min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6 text-text">Equipos de la Liga</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedTeams.map((team) => (
            <Link
              key={team.id}
              to={`/teams/${team.id}`}
              className="bg-body-secondary rounded-lg p-6 hover:shadow-lg transition duration-300 flex flex-col"
            >
              <div className="flex items-center mb-3">
                {/* Placeholder for future logo */}
                <div className="w-12 h-12 bg-gray-300 rounded-full mr-4 flex-shrink-0"></div>
                <h2 className="text-xl font-semibold text-text">{team.name}</h2>
              </div>
              <div className="flex-grow">
                <div className="flex items-center text-text-dark mb-2">
                  <Users size={18} className="mr-2" />
                  <span>{team.playerCount} jugadores</span>
                </div>
                <div className="flex items-center text-text-dark mb-2">
                  <Trophy size={18} className="mr-2" />
                  <span>{team.wins} victorias</span>
                </div>
                <div className="flex items-center text-text-dark">
                  <Star size={18} className="mr-2" />
                  <span>Capitán: {team.captain}</span>
                </div>
              </div>
              <div className="mt-4 text-accent font-medium">Ver detalles del equipo</div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Teams;