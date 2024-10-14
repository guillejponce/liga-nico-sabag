import React from 'react';
import { useParams } from 'react-router-dom';
import { useTeam } from '../hooks/teams/useTeam';
import { useTeamPlayers } from '../hooks/players/useTeamPlayers';
import { Trophy, EqualIcon, Frown, Goal, ShieldAlert, Award } from 'lucide-react';

const TeamView = () => {
  const { teamId } = useParams();
  const { team, loading: teamLoading, error: teamError } = useTeam(teamId);
  const { players, loading: playersLoading, error: playersError } = useTeamPlayers(teamId);

  if (teamLoading || playersLoading) return <div className="text-center py-8">Loading team details...</div>;
  if (teamError) return <div className="text-center py-8 text-red-500">Error: {teamError}</div>;
  if (playersError) return <div className="text-center py-8 text-red-500">Error: {playersError}</div>;
  if (!team) return <div className="text-center py-8">Team not found</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white shadow-lg rounded-lg overflow-hidden mb-8">
        <div className="bg-gradient-to-r from-blue-800 to-blue-900 p-6 text-white">
          <div className="flex items-center">
            {team.logoUrl && (
              <img 
                src={team.logoUrl} 
                alt={`${team.name} logo`} 
                className="w-24 h-24 rounded-full border-4 border-white mr-6"
              />
            )}
            <div>
              <h1 className="text-4xl font-bold">{team.name}</h1>
              <h2 className="text-xl mt-2 font-bold">Capitán: {team.captain}</h2>
              <p className="text-xl mt-2">{team.description}</p>
            </div>
          </div>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-100 p-4 rounded-lg">
              <h2 className="text-2xl font-semibold mb-4">Estadísticas del Equipo</h2>
              <div className="space-y-3">
                <div className="flex items-center">
                  <Trophy className="w-6 h-6 mr-2 text-yellow-500" />
                  <span>Partidos Ganados: {team.won_matches}</span>
                </div>
                <div className="flex items-center">
                  <EqualIcon className="w-6 h-6 mr-2 text-blue-500" />
                  <span>Partidos Empatados: {team.drawn_matches}</span>
                </div>
                <div className="flex items-center">
                  <Frown className="w-6 h-6 mr-2 text-red-500" />
                  <span>Partidos Perdidos: {team.lost_matches}</span>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-100 p-4 rounded-lg">
              <h2 className="text-2xl font-semibold mb-4">Otras estadísticas</h2>
              <div className="space-y-3">
                <div className="flex items-center">
                  <Goal className="w-6 h-6 mr-2 text-green-500" />
                  <span>Goles a favor: {team.scored_goals}</span>
                </div>
                <div className="flex items-center">
                  <ShieldAlert className="w-6 h-6 mr-2 text-orange-500" />
                  <span>Goles en contra: {team.concieved_goals}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Player Statistics Table */}
      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        <div className="bg-gradient-to-r from-green-700 to-green-900 p-4 text-white">
          <h2 className="text-2xl font-bold">Miembros del Equipo</h2>
        </div>
        <div className="p-4 overflow-x-auto">
          <table className="min-w-full table-auto">
            <thead className="bg-gray-200">
              <tr>
                <th className="px-4 py-2 text-left">Nombre</th>
                <th className="px-4 py-2 text-center">
                  <div className="flex items-center justify-center">
                    Goles
                  </div>
                </th>
                <th className="px-4 py-2 text-center">
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 bg-yellow-400 rounded-sm mr-1"></div>
                    Tarjetas Amarillas
                  </div>
                </th>
                <th className="px-4 py-2 text-center">
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 bg-red-600 rounded-sm mr-1"></div>
                    Tarjetas Rojas
                  </div>
                </th>
                <th className="px-4 py-2 text-center">
                  <div className="flex items-center justify-center">
                    <Award className="w-5 h-5 mr-1" />
                    Jugador del Partido
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {players.map((player, index) => (
                <tr key={player.id} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                  <td className="px-4 py-2 font-medium">{`${player.first_name} ${player.last_name}`}</td>
                  <td className="px-4 py-2 text-center">{player.scored_goals}</td>
                  <td className="px-4 py-2 text-center">{player.yellow_cards}</td>
                  <td className="px-4 py-2 text-center">{player.red_cards}</td>
                  <td className="px-4 py-2 text-center">{player.man_of_the_match}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TeamView;