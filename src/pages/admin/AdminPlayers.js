/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect, useCallback } from 'react';
import { debounce } from 'lodash';
import { Plus, Edit, Trash2, Search } from 'lucide-react';
import { fetchPlayers, createPlayer, updatePlayer, deletePlayer } from '../../hooks/admin/playerHandlers';
import { fetchAllTeams } from '../../hooks/admin/teamHandlers';

const AdminPlayers = () => {
  const [players, setPlayers] = useState([]);
  const [teams, setTeams] = useState({});
  const [allTeams, setAllTeams] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [teamFilter, setTeamFilter] = useState('');
  const [editingPlayer, setEditingPlayer] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadPlayers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { players: fetchedPlayers, teams: fetchedTeams } = await fetchPlayers(searchTerm, teamFilter);
      console.log('Fetched players:', fetchedPlayers);
      console.log('Fetched teams:', fetchedTeams);
      setPlayers(fetchedPlayers);
      setTeams(fetchedTeams);
    } catch (err) {
      console.error('Error in loadPlayers:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, teamFilter]);

  const loadAllTeams = useCallback(async () => {
    try {
      const fetchedTeams = await fetchAllTeams();
      console.log('Fetched all teams:', fetchedTeams);
      setAllTeams(fetchedTeams);
    } catch (err) {
      console.error('Error loading teams:', err);
      setError('Failed to load teams. Please refresh the page.');
    }
  }, []);

  useEffect(() => {
    loadPlayers();
    loadAllTeams();
  }, [loadPlayers, loadAllTeams]);

  const debouncedSearch = useCallback(
    debounce(() => {
      loadPlayers();
    }, 300),
    [loadPlayers]
  );

  useEffect(() => {
    debouncedSearch();
    return () => debouncedSearch.cancel();
  }, [searchTerm, debouncedSearch]);

  const handleCreatePlayer = async (id, playerData) => {
    console.log('handleCreatePlayer called with id:', id, 'and playerData:', playerData);
    try {
      console.log('Creating player with data:', playerData);
      if (!playerData) {
        throw new Error('Player data is null or undefined');
      }
      const requiredFields = ['rut', 'team', 'first_name', 'last_name'];
      for (const field of requiredFields) {
        if (!playerData[field]) {
          throw new Error(`${field} is required and cannot be empty`);
        }
      }
      const formattedPlayerData = {
        rut: playerData.rut,
        team: playerData.team, // This should be the RELATION_RECORD_ID
        first_name: playerData.first_name,
        last_name: playerData.last_name,
        email: playerData.email || '',
        scored_goals: Number(playerData.scored_goals || 0),
        yellow_cards: Number(playerData.yellow_cards || 0),
        red_cards: Number(playerData.red_cards || 0),
        man_of_the_match: Number(playerData.man_of_the_match || 0),
      };
      console.log('Formatted player data:', formattedPlayerData);
      const createdPlayer = await createPlayer(formattedPlayerData);
      console.log('Player created successfully:', createdPlayer);
      await loadPlayers();
      setIsModalOpen(false);
    } catch (err) {
      console.error('Error in handleCreatePlayer:', err);
      setError(`Failed to create player: ${err.message}`);
    }
  };

  const handleUpdatePlayer = async (id, playerData) => {
    try {
      console.log('Updating player with ID:', id, 'and data:', playerData);
      const updatedPlayer = await updatePlayer(id, playerData);
      console.log('Player updated successfully:', updatedPlayer);
      await loadPlayers();
      setEditingPlayer(null);
      setIsModalOpen(false);
    } catch (err) {
      console.error('Error in handleUpdatePlayer:', err);
      setError(`Failed to update player: ${err.message}`);
    }
  };

  const handleDeletePlayer = async (id) => {
    if (window.confirm('Are you sure you want to delete this player?')) {
      try {
        console.log('Deleting player with ID:', id);
        await deletePlayer(id);
        console.log('Player deleted successfully');
        await loadPlayers();
      } catch (err) {
        console.error('Error in handleDeletePlayer:', err);
        setError(`Failed to delete player: ${err.message}`);
      }
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">Players Management</h1>
      <div className="mb-4 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search players..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border rounded-md"
            />
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          </div>
          <select
            value={teamFilter}
            onChange={(e) => setTeamFilter(e.target.value)}
            className="px-3 py-2 border rounded-md"
          >
            <option value="">All Teams</option>
            {Object.entries(allTeams).map(([id, name]) => (
              <option key={id} value={id}>{name}</option>
            ))}
          </select>
        </div>
        <button
          onClick={() => {
            setEditingPlayer(null);
            setIsModalOpen(true);
          }}
          className="bg-green-500 text-white px-4 py-2 rounded-md flex items-center"
        >
          <Plus className="mr-2" /> Add Player
        </button>
      </div>

      {loading && <p>Loading players...</p>}
      {error && <p className="text-red-500">{error}</p>}

      <table className="min-w-full bg-white">
        <thead>
          <tr>
            <th className="py-2 px-4 border-b">Name</th>
            <th className="py-2 px-4 border-b">RUT</th>
            <th className="py-2 px-4 border-b">Team</th>
            <th className="py-2 px-4 border-b">Email</th>
            <th className="py-2 px-4 border-b">Goals</th>
            <th className="py-2 px-4 border-b">Yellow Cards</th>
            <th className="py-2 px-4 border-b">Red Cards</th>
            <th className="py-2 px-4 border-b">Player of the Match</th>
            <th className="py-2 px-4 border-b">Actions</th>
          </tr>
        </thead>
        <tbody>
          {players.map((player) => (
            <tr key={player.id}>
              <td className="py-2 px-4 border-b">{`${player.first_name} ${player.last_name}`}</td>
              <td className="py-2 px-4 border-b">{player.rut}</td>
              <td className="py-2 px-4 border-b">{teams[player.team] || allTeams[player.team] || 'Unknown Team'}</td>
              <td className="py-2 px-4 border-b">{player.email}</td>
              <td className="py-2 px-4 border-b">{player.scored_goals}</td>
              <td className="py-2 px-4 border-b">{player.yellow_cards}</td>
              <td className="py-2 px-4 border-b">{player.red_cards}</td>
              <td className="py-2 px-4 border-b">{player.man_of_the_match}</td>
              <td className="py-2 px-4 border-b">
                <button
                  onClick={() => {
                    setEditingPlayer(player);
                    setIsModalOpen(true);
                  }}
                  className="text-blue-500 mr-2"
                >
                  <Edit className="h-5 w-5" />
                </button>
                <button
                  onClick={() => handleDeletePlayer(player.id)}
                  className="text-red-500"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {isModalOpen && (
  <PlayerModal
    player={editingPlayer}
    teams={allTeams}
    onClose={() => {
      setIsModalOpen(false);
      setEditingPlayer(null);
    }}
    onSave={(id, data) => {
      console.log('onSave called with id:', id, 'and data:', data);
      if (editingPlayer) {
        handleUpdatePlayer(id, data);
      } else {
        handleCreatePlayer(id, data);
      }
    }}
  />
)}
    </div>
  );
};

const PlayerModal = ({ player, teams, onClose, onSave }) => {
    const [formData, setFormData] = useState(
      player || {
        rut: '',
        team: '',
        first_name: '',
        last_name: '',
        email: '',
        scored_goals: 0,
        yellow_cards: 0,
        red_cards: 0,
        man_of_the_match: 0,
      }
    );
  
    const [formErrors, setFormErrors] = useState({});
  
    const handleChange = (e) => {
      const { name, value, type } = e.target;
      const updatedValue = type === 'number' 
        ? value === '' ? 0 : Number(value) 
        : value;
      setFormData({ ...formData, [name]: updatedValue });
      setFormErrors({ ...formErrors, [name]: '' });
    };
  
    const validateForm = () => {
      const errors = {};
      const requiredFields = ['rut', 'team', 'first_name', 'last_name'];
      requiredFields.forEach(field => {
        if (!formData[field]) {
          errors[field] = `${field.replace('_', ' ')} is required`;
        }
      });
      setFormErrors(errors);
      return Object.keys(errors).length === 0;
    };
  
    const handleSubmit = (e) => {
        e.preventDefault();
        console.log('Form data before validation:', formData);
        if (validateForm()) {
          console.log('Form data after validation:', formData);
          const formattedData = {
            rut: formData.rut,
            team: formData.team,
            first_name: formData.first_name,
            last_name: formData.last_name,
            email: formData.email || '',
            scored_goals: Number(formData.scored_goals || 0),
            yellow_cards: Number(formData.yellow_cards || 0),
            red_cards: Number(formData.red_cards || 0),
            man_of_the_match: Number(formData.man_of_the_match || 0),
          };
          console.log('Formatted data being sent to onSave:', formattedData);
          onSave(player ? player.id : null, formattedData);
        } else {
          console.log('Form validation failed. Current form data:', formData);
        }
      };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
      <div className="bg-white p-8 rounded-lg max-w-md w-full">
        <h2 className="text-xl font-bold mb-4">
          {player ? 'Edit Player' : 'Add New Player'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">RUT</label>
            <input
              type="text"
              name="rut"
              value={formData.rut}
              onChange={handleChange}
              placeholder="RUT"
              className={`w-full px-3 py-2 border rounded ${formErrors.rut ? 'border-red-500' : ''}`}
              required
            />
            {formErrors.rut && <p className="text-red-500 text-sm">{formErrors.rut}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Team</label>
            <select
              name="team"
              value={formData.team}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded ${formErrors.team ? 'border-red-500' : ''}`}
              required
            >
              <option value="">Select Team</option>
              {Object.entries(teams).map(([id, name]) => (
                <option key={id} value={id}>{name}</option>
              ))}
            </select>
            {formErrors.team && <p className="text-red-500 text-sm">{formErrors.team}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
            <input
              type="text"
              name="first_name"
              value={formData.first_name}
              onChange={handleChange}
              placeholder="First Name"
              className={`w-full px-3 py-2 border rounded ${formErrors.first_name ? 'border-red-500' : ''}`}
              required
            />
            {formErrors.first_name && <p className="text-red-500 text-sm">{formErrors.first_name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
            <input
              type="text"
              name="last_name"
              value={formData.last_name}
              onChange={handleChange}
              placeholder="Last Name"
              className={`w-full px-3 py-2 border rounded ${formErrors.last_name ? 'border-red-500' : ''}`}
              required
            />
            {formErrors.last_name && <p className="text-red-500 text-sm">{formErrors.last_name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Email"
              className="w-full px-3 py-2 border rounded"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Goals Scored</label>
            <input
              type="number"
              name="scored_goals"
              value={formData.scored_goals}
              onChange={handleChange}
              min="0"
              className="w-full px-3 py-2 border rounded"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Yellow Cards</label>
            <input
              type="number"
              name="yellow_cards"
              value={formData.yellow_cards}
              onChange={handleChange}
              min="0"
              className="w-full px-3 py-2 border rounded"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Red Cards</label>
            <input
              type="number"
              name="red_cards"
              value={formData.red_cards}
              onChange={handleChange}
              min="0"
              className="w-full px-3 py-2 border rounded"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Player of the Match Awards</label>
            <input
              type="number"
              name="man_of_the_match"
              value={formData.man_of_the_match}
              onChange={handleChange}
              min="0"
              className="w-full px-3 py-2 border rounded"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="mr-2 px-4 py-2 border rounded"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminPlayers;