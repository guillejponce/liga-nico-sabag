// src/components/Teams.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Trophy, Star, User } from 'lucide-react';
import { useTeams } from '../hooks/teams/useTeams';
import { pb } from '../config';

const Teams = () => {
  const { teams, loading, error } = useTeams();
  const [tableMap, setTableMap] = useState({});

  useEffect(() => {
    const loadTable = async () => {
      try {
        const records = await pb.collection('table').getFullList({ perPage: 500 });
        const map = {};
        records.forEach(r => {
          map[r.team] = r;
        });
        setTableMap(map);
      } catch (err) {
        console.error('Error loading table stats:', err);
      }
    };
    loadTable();
  }, []);

  if (loading) return <div className="text-center py-8">Loading teams...</div>;
  if (error) return <div className="text-center py-8 text-red-500">Error: {error}</div>;

  const sortedTeams = [...teams].sort((a, b) => a.name.localeCompare(b.name));

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
                {team.logo ? (
                  <img 
                    src={pb.getFileUrl(team, team.logo)} 
                    alt={`${team.name} logo`} 
                    className="w-24 h-24 rounded-full mr-4 flex-shrink-0 object-cover scale-300" 
                  />
                ) : (
                  <div className="w-12 h-12 bg-gray-300 rounded-full mr-4 flex-shrink-0"></div>
                )}
                <h2 className="text-xl font-semibold text-text">{team.name}</h2>
              </div>
              <div className="flex-grow">
                <div className="flex items-center text-text-dark mb-2">
                  <Trophy size={18} className="mr-2" />
                  <span>{tableMap[team.id]?.won_matches || 0} victorias</span>
                </div>
                <div className="flex items-center text-text-dark">
                  <User size={18} className="mr-2" />
                  <span>Capitán: {team.captain_name || 'No asignado'}</span>
                </div>
              </div>
              <div className="mt-4 text-accent font-medium">Ver detalles del equipo →</div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Teams;