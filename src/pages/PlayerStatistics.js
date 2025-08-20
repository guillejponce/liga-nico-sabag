import React, { useState, useEffect } from 'react';
import { Goal, AlertTriangle, Users } from 'lucide-react';
import { pb } from '../config';
import SoccerPitch from '../components/teams/SoccerPitch';
import { fetchCurrentEdition } from '../hooks/admin/editionHandlers';

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
  const [currentEdition, setCurrentEdition] = useState(null);

  useEffect(() => {
    const loadCurrentEdition = async () => {
      try {
        const edition = await fetchCurrentEdition();
        setCurrentEdition(edition);
        // No heavy updates here; just set edition for later queries
      } catch (error) {
        console.error('Error loading current edition:', error);
      }
    };

    loadCurrentEdition();
  }, []);

  // Load statistics based on events for the current edition
  useEffect(() => {
    const loadStatsFromEvents = async () => {
      if (!currentEdition) return;
      try {
        setLoading(true);

        // 1. Get all matchdays for the edition
        const matchdays = await pb.collection('matchdays').getFullList({
          filter: `season = "${currentEdition.id}"`,
          $cancelKey: 'player-stats-matchdays'
        });
        const matchdayIds = matchdays.map(md => md.id);
        if (matchdayIds.length === 0) {
          setPlayers([]);
          return;
        }

        // 2. Build event filter by match ids inside these matchdays
        const matches = await pb.collection('matches').getFullList({
          filter: `(${matchdayIds.map(id => `matchday = "${id}"`).join(' || ')}) && is_finished = true`,
          $cancelKey: 'player-stats-matches'
        });
        const matchIds = matches.map(m => m.id);
        if (matchIds.length === 0) {
          setPlayers([]);
          return;
        }

        const eventType = activeTab === TABS.GOALS ? 'goal' : (activeTab === TABS.YELLOW_CARDS ? 'yellow_card' : 'red_card');
        const eventFilter = matchIds.map(id => `match = "${id}"`).join(' || ');

        const events = await pb.collection('events').getFullList({
          filter: `type = "${eventType}" && (${eventFilter})`,
          expand: 'player.team',
          $cancelKey: 'player-stats-events'
        });

        // 3. Aggregate per player
        const map = {};
        events.forEach(ev => {
          const p = ev.expand?.player;
          if (!p) return;
          if (!map[p.id]) {
            map[p.id] = { count: 0, player: p };
          }
          map[p.id].count += 1;
        });

        const playersArr = Object.values(map).sort((a,b)=>b.count - a.count);
        setPlayers(playersArr);
      } catch(err){
        if(!err.message?.includes('autocancelled')){
          console.error('Error loading player stats from events:', err);
        }
      } finally {
        setLoading(false);
      }
    };

    loadStatsFromEvents();

    return () => pb.cancelAllRequests();
  }, [activeTab, currentEdition]);

  useEffect(() => {
    const loadMatchdays = async () => {
      if (!currentEdition) return;

      try {
        const records = await pb.collection('matchdays').getFullList({
          filter: `season = "${currentEdition.id}"`,
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
  }, [currentEdition]);

  useEffect(() => {
    const loadTeamsOfWeek = async () => {
      if (activeTab !== TABS.TEAM_OF_WEEK || !currentEdition) return;
      
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
  }, [matchdays, activeTab, currentEdition]);

  // getSortField no longer needed after aggregation

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
    
    const filteredPlayers = players; // Already aggregated & filtered

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
                    {player.player.first_name} {player.player.last_name}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    {player.player.expand?.team?.logo && (
                      <img
                        src={pb.getFileUrl(player.player.expand.team, player.player.expand.team.logo)}
                        alt={player.player.expand.team.name}
                        className="w-6 h-6 rounded-full mr-2"
                      />
                    )}
                    <span>{player.player.expand?.team?.name || 'N/A'}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100">
                    {activeTab === TABS.GOALS && <Goal className="w-4 h-4 mr-1 text-green-500" />}
                    {activeTab === TABS.YELLOW_CARDS && <AlertTriangle className="w-4 h-4 mr-1 text-yellow-500" />}
                    {activeTab === TABS.RED_CARDS && <AlertTriangle className="w-4 h-4 mr-1 text-red-500" />}
                    {player.count}
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
          <div className="border-b border-gray-200 overflow-x-auto">
            <nav className="flex flex-nowrap min-w-full px-4" aria-label="Tabs">
              <button
                onClick={() => setActiveTab(TABS.GOALS)}
                className={`shrink-0 px-3 py-4 text-sm font-medium border-b-2 ${
                  activeTab === TABS.GOALS
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Goal className="w-5 h-5 inline-block mr-2" />
                <span className="whitespace-nowrap">Goleadores</span>
              </button>
              <button
                onClick={() => setActiveTab(TABS.YELLOW_CARDS)}
                className={`shrink-0 px-3 py-4 text-sm font-medium border-b-2 ${
                  activeTab === TABS.YELLOW_CARDS
                    ? 'border-yellow-500 text-yellow-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <AlertTriangle className="w-5 h-5 inline-block mr-2" />
                <span className="whitespace-nowrap">Tarjetas Amarillas</span>
              </button>
              <button
                onClick={() => setActiveTab(TABS.RED_CARDS)}
                className={`shrink-0 px-3 py-4 text-sm font-medium border-b-2 ${
                  activeTab === TABS.RED_CARDS
                    ? 'border-red-500 text-red-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <AlertTriangle className="w-5 h-5 inline-block mr-2" />
                <span className="whitespace-nowrap">Tarjetas Rojas</span>
              </button>
              <button
                onClick={() => setActiveTab(TABS.TEAM_OF_WEEK)}
                className={`shrink-0 px-3 py-4 text-sm font-medium border-b-2 ${
                  activeTab === TABS.TEAM_OF_WEEK
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Users className="w-5 h-5 inline-block mr-2" />
                <span className="whitespace-nowrap">Equipo de la Semana</span>
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