import React, { useState, useEffect } from 'react';
import { Trophy, Edit, Trash2, Loader2, Save, Search } from 'lucide-react';
import { FORMATIONS } from '../../hooks/admin/teamOfTheWeekHandlers';
import {
  fetchTeamOfTheSeason,
  createTeamOfTheSeason,
  updateTeamOfTheSeason,
  deleteTeamOfTheSeason,
  DIVISIONS
} from '../../hooks/admin/teamOfTheSeasonHandlers';
import { fetchEditions } from '../../hooks/admin/editionHandlers';
import { fetchPlayers } from '../../hooks/admin/playerHandlers';
import { toast } from 'react-toastify';
import { debounce } from 'lodash';
import SoccerPitch from '../../components/teams/SoccerPitch';

const AdminTeamOfTheSeason = () => {
  const [editions, setEditions] = useState([]);
  const [selectedEdition, setSelectedEdition] = useState(null);
  const [division, setDivision] = useState('gold');
  const [teamOfTheSeason, setTeamOfTheSeason] = useState(null);
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
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

  // Load editions and players
  useEffect(() => {
    const abortController = new AbortController();

    const loadData = async () => {
      try {
        setLoading(true);
        const [fetchedEditions, { players: fetchedPlayers }] = await Promise.all([
          fetchEditions(),
          fetchPlayers('', '', abortController.signal),
        ]);
        setEditions(fetchedEditions);
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
          toast.error('Failed to load data');
        }
      } finally {
        setLoading(false);
      }
    };

    loadData();

    return () => abortController.abort();
  }, []);

  // Load team of the season when edition or division change
  useEffect(() => {
    let isSubscribed = true;
    const loadTeam = async () => {
      if (!selectedEdition) return;
      try {
        const team = await fetchTeamOfTheSeason(selectedEdition, division);
        if (!isSubscribed) return;
        setTeamOfTheSeason(team);
        if (team) {
          const newData = { ...formData, formation: team.formation || FORMATIONS[0] };
          for (let i = 1; i <= 7; i++) {
            newData[`player${i}`] = team[`player${i}`] || '';
          }
          setFormData(newData);
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
          console.error('Error loading team of the season:', err);
          toast.error('Failed to load team of the season');
        }
      }
    };
    loadTeam();
    return () => {
      isSubscribed = false;
    };
  }, [selectedEdition, division]); // eslint-disable-line react-hooks/exhaustive-deps

  // Search filtering
  useEffect(() => {
    const filterPlayers = () => {
      const filtered = {};
      Object.entries(searchTerms).forEach(([position, term]) => {
        if (!term.trim()) {
          filtered[position] = players;
          return;
        }
        const searchTermLower = term.toLowerCase();
        filtered[position] = players.filter((player) =>
          (player.first_name?.toLowerCase() || '').includes(searchTermLower) ||
          (player.last_name?.toLowerCase() || '').includes(searchTermLower) ||
          (player.expand?.team?.name?.toLowerCase() || '').includes(searchTermLower)
        );
      });
      setFilteredPlayers(filtered);
    };

    const debouncedFilter = debounce(filterPlayers, 300);
    debouncedFilter();
    return () => debouncedFilter.cancel();
  }, [searchTerms, players]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = {
        ...formData,
        edition: selectedEdition,
        division,
      };
      if (teamOfTheSeason) {
        await updateTeamOfTheSeason(teamOfTheSeason.id, data);
        toast.success('Team of the season updated');
      } else {
        await createTeamOfTheSeason(data);
        toast.success('Team of the season created');
      }
      const updated = await fetchTeamOfTheSeason(selectedEdition, division);
      setTeamOfTheSeason(updated);
      setIsEditing(false);
    } catch (err) {
      console.error('Error saving team of the season:', err);
      toast.error(err.message);
    }
  };

  const handleDelete = async () => {
    if (!teamOfTheSeason || !window.confirm('Are you sure you want to delete this team of the season?')) return;
    try {
      await deleteTeamOfTheSeason(teamOfTheSeason.id);
      setTeamOfTheSeason(null);
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
      toast.success('Team of the season deleted');
    } catch (err) {
      console.error('Error deleting team of the season:', err);
      toast.error('Failed to delete team of the season');
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
          Team of the Season Management
        </h1>
        <div className="flex gap-2">
          <select
            className="px-4 py-2 border rounded-lg"
            value={selectedEdition || ''}
            onChange={(e) => {
              setSelectedEdition(e.target.value);
              setIsEditing(false);
            }}
          >
            <option value="">Select Edition</option>
            {editions.map((ed) => (
              <option key={ed.id} value={ed.id}>
                Edición {ed.number} - {ed.year} ({ed.semester === '1' ? 'S1' : 'S2'})
              </option>
            ))}
          </select>
          <select
            className="px-4 py-2 border rounded-lg"
            value={division}
            onChange={(e) => {
              setDivision(e.target.value);
              setIsEditing(false);
            }}
          >
            {DIVISIONS.map((div) => (
              <option key={div} value={div}>{div === 'gold' ? 'Copa de Oro' : 'Copa de Plata'}</option>
            ))}
          </select>
          <select
            className="px-4 py-2 border rounded-lg"
            value={formData.formation}
            disabled={!isEditing && teamOfTheSeason}
            onChange={(e) => setFormData({ ...formData, formation: e.target.value })}
          >
            {FORMATIONS.map((f) => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
        </div>
      </div>

      {selectedEdition && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex justify-between mb-4">
            <h2 className="text-xl font-semibold">
              {teamOfTheSeason ? 'Edit Team of the Season' : 'Create Team of the Season'}
            </h2>
            <div className="space-x-2">
              {teamOfTheSeason && !isEditing && (
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
            <div className="space-y-6">
              <div className="mb-6">
                <SoccerPitch
                  formation={formData.formation}
                  players={[1, 2, 3, 4, 5, 6, 7].map((num) => ({
                    position: num,
                    firstName: teamOfTheSeason?.expand[`player${num}`]?.first_name || '',
                    lastName: teamOfTheSeason?.expand[`player${num}`]?.last_name || '',
                    expand: {
                      team: teamOfTheSeason?.expand[`player${num}`]?.expand?.team
                        ? {
                            id: teamOfTheSeason.expand[`player${num}`].expand.team.id,
                            name: teamOfTheSeason.expand[`player${num}`].expand.team.name,
                            logo: teamOfTheSeason.expand[`player${num}`].expand.team.logo,
                            collectionId: '6hkvwfswk61t3b1',
                            collectionName: 'teams',
                          }
                        : null,
                    },
                  }))}
                  expanded={true}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6, 7].map((num) => {
                  const playerKey = `player${num}`;
                  const [defCount, midCount] = formData.formation.split('-').map(Number);
                  const positionLabel = num === 1 ? 'Goalkeeper' :
                    num <= 1 + defCount ? 'Defender' :
                    num <= 1 + defCount + midCount ? 'Midfielder' : 'Forward';
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
                              onChange={(e) =>
                                setSearchTerms((prev) => ({ ...prev, [playerKey]: e.target.value }))
                              }
                              className="w-full px-3 py-2 border rounded-lg pr-10"
                              disabled={!isEditing && teamOfTheSeason}
                            />
                            <Search className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
                          </div>
                        </div>
                        <select
                          name={playerKey}
                          value={formData[playerKey]}
                          onChange={(e) => setFormData({ ...formData, [playerKey]: e.target.value })}
                          className="w-full px-3 py-2 border rounded-lg"
                          disabled={!isEditing && teamOfTheSeason}
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

            {(isEditing || !teamOfTheSeason) && (
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
                  {teamOfTheSeason ? 'Update' : 'Create'}
                </button>
              </div>
            )}
          </form>
        </div>
      )}
    </div>
  );
};

export default AdminTeamOfTheSeason;
