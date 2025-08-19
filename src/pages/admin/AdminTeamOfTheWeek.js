import React, { useState, useEffect } from 'react';
import { Trophy, Edit, Trash2, Loader2, Save, Search } from 'lucide-react';
import { 
  fetchTeamOfTheWeek, 
  createTeamOfTheWeek, 
  updateTeamOfTheWeek, 
  deleteTeamOfTheWeek,
  FORMATIONS 
} from '../../hooks/admin/teamOfTheWeekHandlers';
import { fetchMatchdays } from '../../hooks/admin/matchdayHandlers';
import { fetchPlayers } from '../../hooks/admin/playerHandlers';
import { fetchCurrentEdition } from '../../hooks/admin/editionHandlers';
import { toast } from 'react-toastify';
import { debounce } from 'lodash';
import SoccerPitch from '../../components/teams/SoccerPitch';

// Helper function to get phase type
const getPhaseType = (phase) => {
  if (phase.includes('group_a') || phase.includes('group_b')) return 'groups';
  if (phase.includes('gold_group') || phase.includes('silver_group') || phase.includes('bronze_group')) return 'playoffs';
  if (phase.includes('semi')) return 'semifinals';
  if (phase.includes('final')) return 'finals';
  return phase;
};

// Helper function to get phase label
const getPhaseTypeLabel = (phaseType) => {
  const labels = {
    'groups': 'Fase de Grupos',
    'playoffs': 'Playoffs',
    'semifinals': 'Semifinales',
    'finals': 'Finales'
  };
  return labels[phaseType] || phaseType;
};

const AdminTeamOfTheWeek = () => {
  // matchdays state removed: not used
  const [groupedMatchdays, setGroupedMatchdays] = useState([]);
  const [selectedMatchday, setSelectedMatchday] = useState(null);
  const [teamOfTheWeek, setTeamOfTheWeek] = useState(null);
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  // error state removed: not used
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    formation: FORMATIONS[0],
    player1: '',
    player2: '',
    player3: '',
    player4: '',
    player5: '',
    player6: '',
    player7: '',
  });
  const [searchTerms, setSearchTerms] = useState({
    player1: '',
    player2: '',
    player3: '',
    player4: '',
    player5: '',
    player6: '',
    player7: '',
  });
  const [filteredPlayers, setFilteredPlayers] = useState({
    player1: [],
    player2: [],
    player3: [],
    player4: [],
    player5: [],
    player6: [],
    player7: [],
  });

  // Load matchdays and players
  useEffect(() => {
    const abortController = new AbortController();
    
    const loadData = async () => {
      try {
        setLoading(true);
        
        // First get current edition
        const currentEdition = await fetchCurrentEdition();
        if (!currentEdition) {
          // log message but no error state
          console.warn('No hay temporada activa en este momento.');
          setLoading(false);
          return;
        }

        // Then fetch matchdays for current edition and players
        const [fetchedMatchdays, { players: fetchedPlayers }] = await Promise.all([
          fetchMatchdays(),
          fetchPlayers('', '', abortController.signal)
        ]);

        // Filter matchdays by current edition
        const currentEditionMatchdays = fetchedMatchdays.filter(
          matchday => matchday.expand?.season?.id === currentEdition.id
        );

        // Group matchdays by phase type and round number
        const grouped = currentEditionMatchdays.reduce((acc, matchday) => {
          const phaseType = getPhaseType(matchday.phase);
          const key = `${phaseType}-${matchday.number}`;
          
          if (!acc[key]) {
            acc[key] = {
              phaseType,
              number: matchday.number,
              matchdays: []
            };
          }
          
          acc[key].matchdays.push(matchday);
          return acc;
        }, {});

        // Convert to array and sort
        const groupedArray = Object.values(grouped).sort((a, b) => {
          // Sort by phase type first
          const phaseOrder = ['groups', 'playoffs', 'semifinals', 'finals'];
          const phaseComparison = phaseOrder.indexOf(a.phaseType) - phaseOrder.indexOf(b.phaseType);
          if (phaseComparison !== 0) return phaseComparison;
          
          // Then by round number
          return a.number - b.number;
        });

        // matchdays not needed individually
        setGroupedMatchdays(groupedArray);
        setPlayers(fetchedPlayers);
        setFilteredPlayers({
          player1: fetchedPlayers,
          player2: fetchedPlayers,
          player3: fetchedPlayers,
          player4: fetchedPlayers,
          player5: fetchedPlayers,
          player6: fetchedPlayers,
          player7: fetchedPlayers,
        });
      } catch (err) {
        if (!err.message?.includes('autocancelled')) {
          console.error('Error loading initial data:', err);
          //
        }
      } finally {
        setLoading(false);
      }
    };

    loadData();

    return () => {
      abortController.abort();
    };
  }, []);

  // Load team of the week when matchday changes
  useEffect(() => {
    let isSubscribed = true;
    
    const loadTeamOfTheWeek = async () => {
      if (!selectedMatchday) return;
      try {
        const team = await fetchTeamOfTheWeek(selectedMatchday);
        if (!isSubscribed) return;
        
        setTeamOfTheWeek(team);
        if (team) {
          setFormData({
            formation: team.formation || '4-2-1',
            player1: team.player1,
            player2: team.player2,
            player3: team.player3,
            player4: team.player4,
            player5: team.player5,
            player6: team.player6,
            player7: team.player7,
          });
        } else {
          setFormData({
            formation: FORMATIONS[0],
            player1: '',
            player2: '',
            player3: '',
            player4: '',
            player5: '',
            player6: '',
            player7: '',
          });
        }
      } catch (err) {
        if (!err.message?.includes('autocancelled')) {
          console.error('Error loading team of the week:', err);
          toast.error('Failed to load team of the week');
        }
      }
    };

    loadTeamOfTheWeek();

    return () => {
      isSubscribed = false;
    };
  }, [selectedMatchday]);

  useEffect(() => {
    const filterPlayers = () => {
      const filtered = {};
      Object.entries(searchTerms).forEach(([position, term]) => {
        if (!term.trim()) {
          filtered[position] = players;
          return;
        }

        const searchTermLower = term.toLowerCase();
        filtered[position] = players.filter(player => 
          (player.first_name?.toLowerCase() || '').includes(searchTermLower) ||
          (player.last_name?.toLowerCase() || '').includes(searchTermLower) ||
          (player.expand?.team?.name?.toLowerCase() || '').includes(searchTermLower)
        );
      });
      setFilteredPlayers(filtered);
    };

    // Inicializar los jugadores filtrados con todos los jugadores
    setFilteredPlayers({
      player1: players,
      player2: players,
      player3: players,
      player4: players,
      player5: players,
      player6: players,
      player7: players,
    });

    const debouncedFilter = debounce(filterPlayers, 300);
    debouncedFilter();

    return () => debouncedFilter.cancel();
  }, [searchTerms, players]);

  // Asegurarse de que los jugadores filtrados se actualicen cuando cambian los jugadores
  useEffect(() => {
    setFilteredPlayers({
      player1: players,
      player2: players,
      player3: players,
      player4: players,
      player5: players,
      player6: players,
      player7: players,
    });
  }, [players]);

  const handleMatchdayChange = (matchdayId) => {
    setSelectedMatchday(matchdayId);
    setIsEditing(false);
  };

  const handleFormChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = {
        ...formData,
        matchday: selectedMatchday
      };

      if (teamOfTheWeek) {
        await updateTeamOfTheWeek(teamOfTheWeek.id, data);
        toast.success('Team of the week updated successfully');
      } else {
        await createTeamOfTheWeek(data);
        toast.success('Team of the week created successfully');
      }

      const updatedTeam = await fetchTeamOfTheWeek(selectedMatchday);
      setTeamOfTheWeek(updatedTeam);
      setIsEditing(false);
    } catch (err) {
      console.error('Error saving team of the week:', err);
      toast.error(err.message);
    }
  };

  const handleDelete = async () => {
    if (!teamOfTheWeek || !window.confirm('Are you sure you want to delete this team of the week?')) {
      return;
    }

    try {
      await deleteTeamOfTheWeek(teamOfTheWeek.id);
      setTeamOfTheWeek(null);
      setFormData({
        formation: FORMATIONS[0],
        player1: '',
        player2: '',
        player3: '',
        player4: '',
        player5: '',
        player6: '',
        player7: '',
      });
      toast.success('Team of the week deleted successfully');
    } catch (err) {
      console.error('Error deleting team of the week:', err);
      toast.error('Failed to delete team of the week');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <span className="ml-2 text-lg">Loading...</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold flex items-center">
          <Trophy className="w-6 h-6 mr-2" />
          Team of the Week Management
        </h1>
        <select
          className="px-4 py-2 border rounded-lg"
          value={selectedMatchday || ''}
          onChange={(e) => handleMatchdayChange(e.target.value)}
        >
          <option value="">Select Round</option>
          {groupedMatchdays.map((group) => (
            <option 
              key={`${group.phaseType}-${group.number}`} 
              value={group.matchdays[0].id}
            >
              {getPhaseTypeLabel(group.phaseType)} - Jornada {group.number}
            </option>
          ))}
        </select>
      </div>

      {selectedMatchday && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex justify-between mb-4">
            <h2 className="text-xl font-semibold">
              {teamOfTheWeek ? 'Edit Team of the Week' : 'Create Team of the Week'}
            </h2>
            <div className="space-x-2">
              {teamOfTheWeek && !isEditing && (
                <>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                  >
                    <Edit className="w-4 h-4 inline mr-2" />
                    Edit
                  </button>
                  <button
                    onClick={handleDelete}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                  >
                    <Trash2 className="w-4 h-4 inline mr-2" />
                    Delete
                  </button>
                </>
              )}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Formation
                </label>
                <select
                  name="formation"
                  value={formData.formation}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 border rounded-lg"
                  disabled={!isEditing && teamOfTheWeek}
                >
                  {FORMATIONS.map((formation) => (
                    <option key={formation} value={formation}>
                      {formation}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-6">
              <div className="mb-6">
                <SoccerPitch 
                  formation={formData.formation}
                  players={[1, 2, 3, 4, 5, 6, 7].map(num => ({
                    position: num,
                    firstName: teamOfTheWeek?.expand[`player${num}`]?.first_name || '',
                    lastName: teamOfTheWeek?.expand[`player${num}`]?.last_name || '',
                    expand: {
                      team: teamOfTheWeek?.expand[`player${num}`]?.expand?.team ? {
                        id: teamOfTheWeek.expand[`player${num}`].expand.team.id,
                        name: teamOfTheWeek.expand[`player${num}`].expand.team.name,
                        logo: teamOfTheWeek.expand[`player${num}`].expand.team.logo,
                        collectionId: '6hkvwfswk61t3b1',
                        collectionName: 'teams'
                      } : null
                    }
                  }))}
                  expanded={true}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6, 7].map((num) => {
                  const playerKey = `player${num}`;
                  const positionLabel = num === 1 ? 'Goalkeeper' : 
                    num <= 1 + parseInt(formData.formation.split('-')[0]) ? 'Defender' :
                    num <= 1 + parseInt(formData.formation.split('-')[0]) + parseInt(formData.formation.split('-')[1]) ? 'Midfielder' : 'Forward';
                  
                  return (
                    <div key={num}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {positionLabel} ({num})
                      </label>
                      <div className="relative">
                        <div className="flex gap-2 mb-2">
                          <div className="relative flex-1">
                            <input
                              type="text"
                              placeholder="Search players..."
                              value={searchTerms[playerKey]}
                              onChange={(e) => setSearchTerms(prev => ({
                                ...prev,
                                [playerKey]: e.target.value
                              }))}
                              className="w-full px-3 py-2 border rounded-lg pr-10"
                              disabled={!isEditing && teamOfTheWeek}
                            />
                            <Search className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
                          </div>
                        </div>
                        <select
                          name={playerKey}
                          value={formData[playerKey]}
                          onChange={handleFormChange}
                          className="w-full px-3 py-2 border rounded-lg"
                          disabled={!isEditing && teamOfTheWeek}
                        >
                          <option value="">Select Player</option>
                          {filteredPlayers[playerKey]?.map((player) => (
                            <option key={player.id} value={player.id}>
                              {player.first_name} {player.last_name} ({player.expand?.team?.name || 'No Team'})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {(isEditing || !teamOfTheWeek) && (
              <div className="flex justify-end space-x-2">
                {isEditing && (
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                >
                  <Save className="w-4 h-4 inline mr-2" />
                  {teamOfTheWeek ? 'Update' : 'Create'}
                </button>
              </div>
            )}
          </form>

          {teamOfTheWeek && !isEditing && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-4">Current Team of the Week</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6, 7].map((num) => {
                  const player = players.find(p => p.id === teamOfTheWeek[`player${num}`]);
                  return (
                    <div key={num} className="bg-gray-50 p-4 rounded-lg">
                      <div className="font-medium">Player {num}</div>
                      <div>{player ? `${player.first_name} ${player.last_name}` : 'Not selected'}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminTeamOfTheWeek;
