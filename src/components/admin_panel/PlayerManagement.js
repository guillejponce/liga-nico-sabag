import React, { useState, useEffect, useCallback } from 'react';
import { pb } from '../../config';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PlayerManagement = () => {
  const [players, setPlayers] = useState([]);
  const [teams, setTeams] = useState({});
  const [allTeams, setAllTeams] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPlayer, setCurrentPlayer] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();

  const checkAdminStatus = useCallback(async () => {
    if (!pb.authStore.isValid) {
      navigate('/login');
      return;
    }
    
    try {
      const user = await pb.collection('users').getOne(pb.authStore.model.id);
      setIsAdmin(user.role === 'admin');
      if (user.role !== 'admin') {
        navigate('/');  // Redirect to home if not admin
      }
    } catch (error) {
      console.error('Error checking admin status:', error);
      navigate('/login');
    }
  }, [navigate]);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [teamsRecords, playersRecords] = await Promise.all([
        pb.collection('teams').getFullList({ sort: 'name' }),
        pb.collection('players').getFullList({
          sort: 'created',
          expand: 'team',
        })
      ]);

      const teamsMap = Object.fromEntries(teamsRecords.map(team => [team.id, team.name]));
      setTeams(teamsMap);
      setAllTeams(teamsRecords);
      setPlayers(playersRecords);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(`Error fetching data: ${err.message}`);
      if (err.status === 401 || err.status === 403) {
        navigate('/login');
      }
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    checkAdminStatus();
  }, [checkAdminStatus]);

  useEffect(() => {
    if (isAdmin) {
      fetchData();
    }
  }, [isAdmin, fetchData]);

  const handleAddPlayer = () => {
    setCurrentPlayer(null);
    setIsModalOpen(true);
  };

  const handleEditPlayer = (player) => {
    setCurrentPlayer(player);
    setIsModalOpen(true);
  };

  const handleDeletePlayer = async (id) => {
    if (window.confirm('Are you sure you want to delete this player?')) {
      try {
        await pb.collection('players').delete(id);
        setPlayers(players.filter(player => player.id !== id));
      } catch (err) {
        console.error('Error deleting player:', err);
        setError(`Error deleting player: ${err.message}`);
        if (err.status === 401 || err.status === 403) {
          navigate('/login');
        }
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    try {
      if (currentPlayer) {
        await pb.collection('players').update(currentPlayer.id, formData);
      } else {
        await pb.collection('players').create(formData);
      }
      setIsModalOpen(false);
      await fetchData();
    } catch (err) {
      console.error('Error saving player:', err);
      setError(`Error saving player: ${err.message}`);
      if (err.status === 401 || err.status === 403) {
        navigate('/login');
      }
    }
  };

  if (!isAdmin) return null;  // Don't render anything if not admin
  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Player Management</h1>
        <button
          onClick={handleAddPlayer}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded flex items-center"
        >
          <Plus size={20} className="mr-2" /> Add Player
        </button>
      </div>

      <table className="min-w-full bg-white">
        <thead>
          <tr>
            <th className="py-2 px-4 border-b">Name</th>
            <th className="py-2 px-4 border-b">Team</th>
            <th className="py-2 px-4 border-b">Goals</th>
            <th className="py-2 px-4 border-b">Yellow Cards</th>
            <th className="py-2 px-4 border-b">Red Cards</th>
            <th className="py-2 px-4 border-b">Actions</th>
          </tr>
        </thead>
        <tbody>
          {players.map((player) => (
            <tr key={player.id}>
              <td className="py-2 px-4 border-b">{`${player.first_name} ${player.last_name}`}</td>
              <td className="py-2 px-4 border-b">{teams[player.team] || 'No Team'}</td>
              <td className="py-2 px-4 border-b">{player.scored_goals}</td>
              <td className="py-2 px-4 border-b">{player.yellow_cards}</td>
              <td className="py-2 px-4 border-b">{player.red_cards}</td>
              <td className="py-2 px-4 border-b">
                <button
                  onClick={() => handleEditPlayer(player)}
                  className="text-blue-500 hover:text-blue-700 mr-2"
                >
                  <Edit size={20} />
                </button>
                <button
                  onClick={() => handleDeletePlayer(player.id)}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 size={20} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-bold mb-4">
              {currentPlayer ? 'Edit Player' : 'Add New Player'}
            </h3>
            <form onSubmit={handleSubmit}>
              <input
                type="text"
                name="first_name"
                placeholder="First Name"
                defaultValue={currentPlayer?.first_name}
                className="w-full p-2 mb-2 border rounded"
                required
              />
              <input
                type="text"
                name="last_name"
                placeholder="Last Name"
                defaultValue={currentPlayer?.last_name}
                className="w-full p-2 mb-2 border rounded"
                required
              />
              <input
                type="text"
                name="rut"
                placeholder="RUT"
                defaultValue={currentPlayer?.rut}
                className="w-full p-2 mb-2 border rounded"
                required
              />
              <input
                type="email"
                name="email"
                placeholder="Email"
                defaultValue={currentPlayer?.email}
                className="w-full p-2 mb-2 border rounded"
                required
              />
              <select
                name="team"
                defaultValue={currentPlayer?.team}
                className="w-full p-2 mb-2 border rounded"
                required
              >
                <option value="">Select Team</option>
                {allTeams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
              <input
                type="number"
                name="scored_goals"
                placeholder="Scored Goals"
                defaultValue={currentPlayer?.scored_goals}
                className="w-full p-2 mb-2 border rounded"
                required
              />
              <input
                type="number"
                name="yellow_cards"
                placeholder="Yellow Cards"
                defaultValue={currentPlayer?.yellow_cards}
                className="w-full p-2 mb-2 border rounded"
                required
              />
              <input
                type="number"
                name="red_cards"
                placeholder="Red Cards"
                defaultValue={currentPlayer?.red_cards}
                className="w-full p-2 mb-2 border rounded"
                required
              />
              <input
                type="number"
                name="man_of_the_match"
                placeholder="Man of the Match"
                defaultValue={currentPlayer?.man_of_the_match}
                className="w-full p-2 mb-2 border rounded"
                required
              />
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="bg-gray-300 hover:bg-gray-400 text-black font-bold py-2 px-4 rounded mr-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlayerManagement;