/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect, useCallback } from 'react';
import { debounce } from 'lodash';
import { Plus, Edit, Trash2, Search, Upload } from 'lucide-react';
import { fetchTeams, createTeam, updateTeam, deleteTeam } from '../../hooks/admin/teamHandlers';
import { fetchAllPlayers } from '../../hooks/admin/playerHandlers';
import { pb } from '../../config';

const AdminTeams = () => {
  const [teams, setTeams] = useState([]);
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingTeam, setEditingTeam] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadTeams = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const fetchedTeams = await fetchTeams(searchTerm);
      setTeams(fetchedTeams);
    } catch (err) {
      console.error('Error in loadTeams:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [searchTerm]);

  const loadPlayers = useCallback(async () => {
    try {
      const fetchedPlayers = await pb.collection('players').getFullList({
        sort: 'last_name,first_name',
        expand: 'team'
      });
      console.log('Fetched players:', fetchedPlayers);
      setPlayers(fetchedPlayers);
    } catch (err) {
      console.error('Error loading players:', err);
      setError('Failed to load players. Please refresh the page.');
    }
  }, []);

  useEffect(() => {
    loadTeams();
    loadPlayers();
  }, [loadTeams, loadPlayers]);

  const debouncedSearch = useCallback(
    debounce(() => {
      loadTeams();
    }, 300),
    [loadTeams]
  );

  useEffect(() => {
    debouncedSearch();
    return () => debouncedSearch.cancel();
  }, [searchTerm, debouncedSearch]);

  const handleCreateTeam = async (teamData) => {
    try {
      await createTeam(teamData);
      await loadTeams();
      setIsModalOpen(false);
    } catch (err) {
      setError(`Failed to create team: ${err.message}`);
    }
  };

  const handleUpdateTeam = async (id, teamData) => {
    try {
      await updateTeam(id, teamData);
      await loadTeams();
      setEditingTeam(null);
      setIsModalOpen(false);
    } catch (err) {
      setError(`Failed to update team: ${err.message}`);
    }
  };

  const handleDeleteTeam = async (id) => {
    if (window.confirm('Are you sure you want to delete this team?')) {
      try {
        await deleteTeam(id);
        await loadTeams();
      } catch (err) {
        setError(`Failed to delete team: ${err.message}`);
      }
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">Teams Management</h1>
      <div className="mb-4 flex justify-between items-center">
        <div className="relative">
          <input
            type="text"
            placeholder="Search teams..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border rounded-md"
          />
          <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
        </div>
        <button
          onClick={() => {
            setEditingTeam(null);
            setIsModalOpen(true);
          }}
          className="bg-green-500 text-white px-4 py-2 rounded-md flex items-center"
        >
          <Plus className="mr-2" /> Add Team
        </button>
      </div>

      {loading && <p>Loading teams...</p>}
      {error && <p className="text-red-500">{error}</p>}

      <table className="min-w-full bg-white">
        <thead>
          <tr>
            <th className="py-2 px-4 border-b">Logo</th>
            <th className="py-2 px-4 border-b">Name</th>
            <th className="py-2 px-4 border-b">Description</th>
            <th className="py-2 px-4 border-b">Captain</th>
            <th className="py-2 px-4 border-b">Won Matches</th>
            <th className="py-2 px-4 border-b">Drawn Matches</th>
            <th className="py-2 px-4 border-b">Lost Matches</th>
            <th className="py-2 px-4 border-b">Scored Goals</th>
            <th className="py-2 px-4 border-b">Conceded Goals</th>
            <th className="py-2 px-4 border-b">Instagram URL</th>
            <th className="py-2 px-4 border-b">Actions</th>
          </tr>
        </thead>
        <tbody>
          {teams.map((team) => (
            <tr key={team.id}>
              <td className="py-2 px-4 border-b">
                {team.logo ? (
                  <img
                    src={pb.getFileUrl(team, team.logo)}
                    alt={`${team.name} logo`}
                    className="w-10 h-10 object-cover rounded-full"
                  />
                ) : (
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                    <Upload className="w-6 h-6 text-gray-400" />
                  </div>
                )}
              </td>
              <td className="py-2 px-4 border-b">{team.name}</td>
              <td className="py-2 px-4 border-b">{team.description}</td>
              <td className="py-2 px-4 border-b">{team.captain_name}</td>
              <td className="py-2 px-4 border-b">{team.won_matches}</td>
              <td className="py-2 px-4 border-b">{team.drawn_matches}</td>
              <td className="py-2 px-4 border-b">{team.lost_matches}</td>
              <td className="py-2 px-4 border-b">{team.scored_goals}</td>
              <td className="py-2 px-4 border-b">{team.concieved_goals}</td>
              <td className="py-2 px-4 border-b">{team.instagram_url}</td>
              <td className="py-2 px-4 border-b">
                <button
                  onClick={() => {
                    setEditingTeam(team);
                    setIsModalOpen(true);
                  }}
                  className="text-blue-500 mr-2"
                >
                  <Edit className="h-5 w-5" />
                </button>
                <button
                  onClick={() => handleDeleteTeam(team.id)}
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
        <TeamModal
          team={editingTeam}
          players={players}
          onClose={() => {
            setIsModalOpen(false);
            setEditingTeam(null);
          }}
          onSave={(data) => {
            if (editingTeam) {
              handleUpdateTeam(editingTeam.id, data);
            } else {
              handleCreateTeam(data);
            }
          }}
        />
      )}
    </div>
  );
};

const TeamModal = ({ team, players, onClose, onSave }) => {
  const [formData, setFormData] = useState(
    team || {
      name: '',
      description: '',
      captain_id: '',
      instagram_url: '',
    }
  );

  const [formErrors, setFormErrors] = useState({});
  const [logoPreview, setLogoPreview] = useState(team?.logo ? pb.getFileUrl(team, team.logo) : null);

  // Filter players by team when editing
  const availablePlayers = team 
    ? players.filter(player => player.expand?.team?.id === team.id)
    : players;

  console.log('Team:', team);
  console.log('Available players:', availablePlayers);
  console.log('All players:', players);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setFormErrors({ ...formErrors, [name]: '' });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, logo: file });
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.name) errors.name = 'Name is required';
    if (!formData.description) errors.description = 'Description is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      const dataToSave = {
        name: formData.name,
        description: formData.description,
        captain_id: formData.captain_id,
        instagram_url: formData.instagram_url,
      };
      
      if (formData.logo) {
        dataToSave.logo = formData.logo;
      }
      
      onSave(dataToSave);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
      <div className="bg-white p-8 rounded-lg max-w-md w-full">
        <h2 className="text-xl font-bold mb-4">
          {team ? 'Edit Team' : 'Add New Team'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center space-x-4">
            <div className="w-24 h-24 relative">
              {logoPreview ? (
                <img
                  src={logoPreview}
                  alt="Team logo preview"
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                <div className="w-full h-full bg-gray-200 rounded-full flex items-center justify-center">
                  <Upload className="w-8 h-8 text-gray-400" />
                </div>
              )}
              <input
                type="file"
                name="logo"
                onChange={handleFileChange}
                accept="image/*"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </div>
            <div>
              <label htmlFor="logo" className="block text-sm font-medium text-gray-700">
                Team Logo
              </label>
              <p className="text-xs text-gray-500">Click to upload or change</p>
            </div>
          </div>
          
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Team Name"
            className={`w-full px-3 py-2 border rounded ${formErrors.name ? 'border-red-500' : ''}`}
            required
          />
          {formErrors.name && <p className="text-red-500 text-sm">{formErrors.name}</p>}
          
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Team Description"
            className={`w-full px-3 py-2 border rounded ${formErrors.description ? 'border-red-500' : ''}`}
            required
          />
          {formErrors.description && <p className="text-red-500 text-sm">{formErrors.description}</p>}
          
          <div className="relative">
            <select
              name="captain_id"
              value={formData.captain_id}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded appearance-none"
            >
              <option value="">Select Captain</option>
              {availablePlayers.map((player) => (
                <option key={player.id} value={player.id}>
                  {player.first_name} {player.last_name}
                </option>
              ))}
            </select>
            {team && availablePlayers.length === 0 && (
              <p className="text-sm text-gray-500 mt-1">No players available in this team</p>
            )}
          </div>
          
          <input
            type="url"
            name="instagram_url"
            value={formData.instagram_url}
            onChange={handleChange}
            placeholder="Instagram URL"
            className="w-full px-3 py-2 border rounded"
          />
          
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

export default AdminTeams;