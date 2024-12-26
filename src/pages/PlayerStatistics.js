import React, { useState, useEffect } from 'react';
import { Goal, AlertTriangle, Users } from 'lucide-react';
import { pb } from '../config';
import SoccerPitch from '../components/teams/SoccerPitch';

const TABS = {
  GOALS: 'goals',
  YELLOW_CARDS: 'yellow',
  RED_CARDS: 'red',
  TEAM_OF_WEEK: 'team_of_week'
};

const PlayerStatistics = () => {
  const [activeTab, setActiveTab] = useState(TABS.GOALS);
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [matchdays, setMatchdays] = useState([]);
  const [teamsOfWeek, setTeamsOfWeek] = useState([]);

  useEffect(() => {
    const loadPlayers = async () => {
      try {
        setLoading(true);
        const records = await pb.collection('players').getFullList({
          sort: `-${getSortField(activeTab)}`,
          expand: 'team'
        });
        setPlayers(records);
      } catch (error) {
        console.error('Error loading players:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPlayers();
  }, [activeTab]);

  useEffect(() => {
    const loadMatchdays = async () => {
      try {
        const records = await pb.collection('matchdays').getFullList({
          sort: '-number'
        });
        setMatchdays(records);
      } catch (error) {
        if (!error.message?.includes('autocancelled')) {
          console.error('Error loading matchdays:', error);
        }
      }

      return () => {
        pb.cancelAllRequests();
      };
    };

    loadMatchdays();
  }, []);

  useEffect(() => {
    const loadTeamsOfWeek = async () => {
      if (activeTab !== TABS.TEAM_OF_WEEK) return;
      
      try {
        setLoading(true);
        const teamsPromises = matchdays
          .sort((a, b) => b.number - a.number)
          .map(matchday => 
            pb.collection('team_of_the_week')
              .getFirstListItem(`matchday="${matchday.id}"`, {
                expand: 'player1.team,player2.team,player3.team,player4.team,player5.team,player6.team,player7.team,matchday'
              })
              .then(record => ({
                ...record,
                formation: record.formation || '4-2-1' // Default formation if none is set
              }))
              .catch(() => null)
          );

        const results = await Promise.all(teamsPromises);
        const teamsWithMatchdays = results.map((team, index) => ({
          team,
          matchday: matchdays[index]
        })).filter(({ team }) => team !== null);

        setTeamsOfWeek(teamsWithMatchdays);
      } catch (error) {
        if (!error.message?.includes('autocancelled')) {
          console.error('Error loading teams of the week:', error);
        }
      } finally {
        setLoading(false);
      }
    };

    loadTeamsOfWeek();
  }, [matchdays, activeTab]);

  const getSortField = (tab) => {
    switch (tab) {
      case TABS.GOALS:
        return 'scored_goals';
      case TABS.YELLOW_CARDS:
        return 'yellow_cards';
      case TABS.RED_CARDS:
        return 'red_cards';
      default:
        return 'scored_goals';
    }
  };

  const formatTeamOfWeekPlayers = (teamOfWeek) => {
    if (!teamOfWeek) return [];
    return [1, 2, 3, 4, 5, 6, 7].map(num => ({
      position: num,
      firstName: teamOfWeek.expand[`player${num}`]?.first_name || '',
      lastName: teamOfWeek.expand[`player${num}`]?.last_name || '',
      expand: {
        team: {
          id: teamOfWeek.expand[`player${num}`]?.expand?.team?.id,
          name: teamOfWeek.expand[`player${num}`]?.expand?.team?.name,
          logo: teamOfWeek.expand[`player${num}`]?.expand?.team?.logo,
          collectionId: '6hkvwfswk61t3b1',
          collectionName: 'teams'
        }
      }
    }));
  };

  const renderTeamOfWeek = () => {
    if (matchdays.length === 0) {
      return <div className="text-center py-8">No matchdays available</div>;
    }

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-2">
        {teamsOfWeek.map(({ team: teamOfWeek, matchday }) => {
          if (!teamOfWeek) {
            return (
              <div key={matchday.id} className="bg-white rounded-lg p-3 shadow">
                <h3 className="text-base font-semibold mb-2">Matchday {matchday.number}</h3>
                <p className="text-sm text-gray-500">No team of the week selected</p>
              </div>
            );
          }

          return (
            <div key={matchday.id} className="bg-white rounded-lg p-3 shadow flex flex-col">
              <h3 className="text-base font-semibold mb-2 text-center">Matchday {matchday.number}</h3>
              <div className="flex-1" style={{ height: '400px', minHeight: '400px' }}>
                <SoccerPitch
                  formation={teamOfWeek.formation || '4-2-1'}
                  players={formatTeamOfWeekPlayers(teamOfWeek)}
                  expanded={true}
                  compact={true}
                />
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const getTabContent = () => {
    if (activeTab === TABS.TEAM_OF_WEEK) {
      return renderTeamOfWeek();
    }
    
    const filteredPlayers = players.filter(player => {
      switch (activeTab) {
        case TABS.GOALS:
          return player.scored_goals > 0;
        case TABS.YELLOW_CARDS:
          return player.yellow_cards > 0;
        case TABS.RED_CARDS:
          return player.red_cards > 0;
        default:
          return true;
      }
    });

    return (
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white rounded-lg overflow-hidden shadow-lg">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Jugador
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Equipo
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                {activeTab === TABS.GOALS ? 'Goles' : 
                 activeTab === TABS.YELLOW_CARDS ? 'Tarjetas Amarillas' : 
                 'Tarjetas Rojas'}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredPlayers.map((player, index) => (
              <tr key={player.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="font-medium text-gray-900">
                    {player.first_name} {player.last_name}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    {player.expand?.team?.logo && (
                      <img
                        src={pb.getFileUrl(player.expand.team, player.expand.team.logo)}
                        alt={player.expand.team.name}
                        className="w-6 h-6 rounded-full mr-2"
                      />
                    )}
                    <span>{player.expand?.team?.name || 'N/A'}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100">
                    {activeTab === TABS.GOALS && <Goal className="w-4 h-4 mr-1 text-green-500" />}
                    {activeTab === TABS.YELLOW_CARDS && <AlertTriangle className="w-4 h-4 mr-1 text-yellow-500" />}
                    {activeTab === TABS.RED_CARDS && <AlertTriangle className="w-4 h-4 mr-1 text-red-500" />}
                    {activeTab === TABS.GOALS ? player.scored_goals :
                     activeTab === TABS.YELLOW_CARDS ? player.yellow_cards :
                     player.red_cards}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Estadísticas de Jugadores</h1>
        
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-4 px-4" aria-label="Tabs">
              <button
                onClick={() => setActiveTab(TABS.GOALS)}
                className={`px-3 py-4 text-sm font-medium border-b-2 ${
                  activeTab === TABS.GOALS
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Goal className="w-5 h-5 inline-block mr-2" />
                Goleadores
              </button>
              <button
                onClick={() => setActiveTab(TABS.YELLOW_CARDS)}
                className={`px-3 py-4 text-sm font-medium border-b-2 ${
                  activeTab === TABS.YELLOW_CARDS
                    ? 'border-yellow-500 text-yellow-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <AlertTriangle className="w-5 h-5 inline-block mr-2" />
                Tarjetas Amarillas
              </button>
              <button
                onClick={() => setActiveTab(TABS.RED_CARDS)}
                className={`px-3 py-4 text-sm font-medium border-b-2 ${
                  activeTab === TABS.RED_CARDS
                    ? 'border-red-500 text-red-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <AlertTriangle className="w-5 h-5 inline-block mr-2" />
                Tarjetas Rojas
              </button>
              <button
                onClick={() => setActiveTab(TABS.TEAM_OF_WEEK)}
                className={`px-3 py-4 text-sm font-medium border-b-2 ${
                  activeTab === TABS.TEAM_OF_WEEK
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Users className="w-5 h-5 inline-block mr-2" />
                Equipo de la Semana
              </button>
            </nav>
          </div>
          
          <div className="p-4">
            {loading ? (
              <div className="text-center py-4">Loading...</div>
            ) : (
              getTabContent()
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerStatistics; 