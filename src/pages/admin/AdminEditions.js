import React, { useState, useEffect } from 'react';
import { Loader2, Plus, Edit2, Trash2, Trophy, Star } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { pb } from '../../config';
import { fetchEditions, createEdition, updateEdition, deleteEdition, setCurrentEdition } from '../../hooks/admin/editionHandlers';
import { fetchTeams } from '../../hooks/admin/teamHandlers';
import { fetchPlayers } from '../../hooks/admin/playerHandlers';

const AdminEditions = () => {
  const [editions, setEditions] = useState([]);
  const [teams, setTeams] = useState([]);
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEdition, setEditingEdition] = useState(null);
  const [updatingCurrent, setUpdatingCurrent] = useState(false);
  const [formData, setFormData] = useState({
    number: '',
    year: new Date().getFullYear(),
    semester: '1',
    format: 'groups',
    description: '',
    gold_champion: '',
    silver_champion: '',
    gold_second: '',
    silver_second: '',
    topscorer: '',
    player_of_the_tournament: '',
    top_goalkeeper: ''
  });
  const [abortController, setAbortController] = useState(new AbortController());

  useEffect(() => {
    loadData();
    return () => {
      abortController.abort();
    };
  }, []);

  const loadData = async () => {
    abortController.abort();
    const newController = new AbortController();
    setAbortController(newController);

    try {
      setLoading(true);
      const [editionsData, teamsData, playersData] = await Promise.all([
        fetchEditions(),
        fetchTeams('', '', newController.signal),
        fetchPlayers('', '', newController.signal)
      ]);
      
      if (!newController.signal.aborted) {
        setEditions(Array.isArray(editionsData) ? editionsData : []);
        setTeams(Array.isArray(teamsData?.teams) ? teamsData.teams : []);
        setPlayers(Array.isArray(playersData?.players) ? playersData.players : []);
      }
    } catch (error) {
      if (!error.message?.includes('autocancelled')) {
        console.error('Error loading data:', error);
        toast.error('Error cargando datos');
      }
      if (!newController.signal.aborted) {
        setEditions([]);
        setTeams([]);
        setPlayers([]);
      }
    } finally {
      if (!newController.signal.aborted) {
        setLoading(false);
      }
    }
  };

  const handleOpenModal = (edition = null) => {
    if (edition) {
      setEditingEdition(edition);
      setFormData({
        number: edition.number,
        year: edition.year,
        semester: edition.semester,
        description: edition.description || '',
        format: edition.format || 'groups',
        gold_champion: edition.gold_champion || '',
        silver_champion: edition.silver_champion || '',
        gold_second: edition.gold_second || '',
        silver_second: edition.silver_second || '',
        topscorer: edition.topscorer || '',
        player_of_the_tournament: edition.player_of_the_tournament || '',
        top_goalkeeper: edition.top_goalkeeper || ''
      });
    } else {
      setEditingEdition(null);
      setFormData({
        number: '',
        year: new Date().getFullYear(),
        semester: '1',
        format: 'groups',
        description: '',
        gold_champion: '',
        silver_champion: '',
        gold_second: '',
        silver_second: '',
        topscorer: '',
        player_of_the_tournament: '',
        top_goalkeeper: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingEdition(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingEdition) {
        await updateEdition(editingEdition.id, formData);
        toast.success('Edition updated successfully');
      } else {
        await createEdition(formData);
        toast.success('Edition created successfully');
      }
      handleCloseModal();
      loadData();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this edition?')) return;
    
    try {
      await deleteEdition(id);
      toast.success('Edition deleted successfully');
      loadData();
    } catch (error) {
      toast.error('Error deleting edition');
    }
  };

  const handleSetCurrentEdition = async (id) => {
    try {
      setUpdatingCurrent(true);
      await setCurrentEdition(id);
      toast.success('Current edition updated successfully');
      loadData();
    } catch (error) {
      toast.error('Error updating current edition');
    } finally {
      setUpdatingCurrent(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <span className="ml-2 text-lg">Loading editions...</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Edition Management</h1>
        <button
          onClick={() => handleOpenModal()}
          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg flex items-center"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add New Edition
        </button>
      </div>

      <div className="grid gap-6">
        {editions.map((edition) => (
          <div key={edition.id} className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden">
            {/* Header Section */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4 text-white">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-bold">
                    Edition {edition.number}
                  </h3>
                  {edition.is_current && (
                    <span className="bg-yellow-400 text-blue-900 px-2 py-1 rounded-full text-xs font-semibold flex items-center">
                      <Star className="w-3 h-3 mr-1" />
                      Current
                    </span>
                  )}
                </div>
                <div className="flex space-x-2">
                  {!edition.is_current && (
                    <button
                      onClick={() => handleSetCurrentEdition(edition.id)}
                      disabled={updatingCurrent}
                      className="p-2 bg-yellow-400 hover:bg-yellow-500 text-blue-900 rounded-lg transition-colors duration-200 flex items-center"
                    >
                      <Star className="w-5 h-5" />
                      {updatingCurrent && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
                    </button>
                  )}
                  <button
                    onClick={() => handleOpenModal(edition)}
                    className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors duration-200"
                  >
                    <Edit2 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(edition.id)}
                    className="p-2 bg-white/10 hover:bg-red-500 rounded-lg transition-colors duration-200"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <p className="text-blue-100">
                  {edition.year} - {edition.semester === "1" ? "1st" : "2nd"} Semester
                </p>
                {edition.is_current && (
                  <span className="text-xs text-blue-200">
                    (Active season - matchdays and fixtures will be shown for this edition)
                  </span>
                )}
              </div>
              {edition.description && (
                <p className="mt-2 text-sm text-blue-100 border-t border-blue-400/30 pt-2">
                  {edition.description}
                </p>
              )}
            </div>

            {/* Content Section */}
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Gold Division */}
                <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                  <h4 className="font-semibold text-amber-800 mb-3 flex items-center">
                    <Trophy className="w-5 h-5 mr-2 text-amber-600" />
                    Gold Division
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between p-2 bg-white rounded border border-amber-100">
                      <span className="text-gray-600">Champion</span>
                      <span className="font-medium text-amber-900">{edition.expand?.gold_champion?.name || 'Not set'}</span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-white rounded border border-amber-100">
                      <span className="text-gray-600">Runner-up</span>
                      <span className="font-medium text-amber-900">{edition.expand?.gold_second?.name || 'Not set'}</span>
                    </div>
                  </div>
                </div>

                {/* Silver Division */}
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <h4 className="font-semibold text-gray-700 mb-3 flex items-center">
                    <Trophy className="w-5 h-5 mr-2 text-gray-500" />
                    Silver Division
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between p-2 bg-white rounded border border-gray-200">
                      <span className="text-gray-600">Champion</span>
                      <span className="font-medium text-gray-900">{edition.expand?.silver_champion?.name || 'Not set'}</span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-white rounded border border-gray-200">
                      <span className="text-gray-600">Runner-up</span>
                      <span className="font-medium text-gray-900">{edition.expand?.silver_second?.name || 'Not set'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Individual Awards */}
              <div className="mt-6">
                <h4 className="font-semibold text-gray-700 mb-4 flex items-center">
                  <Trophy className="w-5 h-5 mr-2 text-blue-500" />
                  Individual Awards
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Top Scorer */}
                  <div className="bg-white rounded-lg p-3 border border-gray-200 shadow-sm">
                    <div className="text-sm text-gray-500 mb-1">Top Scorer</div>
                    <div className="font-medium">
                      {edition.expand?.topscorer ? 
                        `${edition.expand.topscorer.first_name} ${edition.expand.topscorer.last_name}` : 
                        'Not set'
                      }
                    </div>
                  </div>

                  {/* Player of Tournament */}
                  <div className="bg-white rounded-lg p-3 border border-gray-200 shadow-sm">
                    <div className="text-sm text-gray-500 mb-1">Player of Tournament</div>
                    <div className="font-medium">
                      {edition.expand?.player_of_the_tournament ? 
                        `${edition.expand.player_of_the_tournament.first_name} ${edition.expand.player_of_the_tournament.last_name}` : 
                        'Not set'
                      }
                    </div>
                  </div>

                  {/* Top Goalkeeper */}
                  <div className="bg-white rounded-lg p-3 border border-gray-200 shadow-sm">
                    <div className="text-sm text-gray-500 mb-1">Top Goalkeeper</div>
                    <div className="font-medium">
                      {edition.expand?.top_goalkeeper ? 
                        `${edition.expand.top_goalkeeper.first_name} ${edition.expand.top_goalkeeper.last_name}` : 
                        'Not set'
                      }
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6">
            <h2 className="text-xl font-semibold mb-4">
              {editingEdition ? 'Editar Edición' : 'Crear Nueva Edición'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Basic Info */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Número</label>
                  <input
                    type="number"
                    value={formData.number}
                    onChange={(e) => setFormData({ ...formData, number: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Año</label>
                  <input
                    type="number"
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Semestre</label>
                  <select
                    value={formData.semester}
                    onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                  >
                    <option value="1">Primer Semestre</option>
                    <option value="2">Segundo Semestre</option>
                  </select>
                </div>
              </div>

              {/* Format */}
              <div>
                <label className="block text-sm font-medium mb-1">Formato</label>
                <select
                  value={formData.format}
                  onChange={(e) => setFormData({ ...formData, format: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                >
                  <option value="groups">Groups</option>
                  <option value="league">League</option>
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium mb-1">Descripción</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  rows="2"
                />
              </div>

              {/* Team Selections */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">División Oro</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium mb-1">Campeón</label>
                      <select
                        value={formData.gold_champion}
                        onChange={(e) => setFormData({ ...formData, gold_champion: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg"
                      >
                        <option value="">Seleccionar equipo</option>
                        {teams.map(team => (
                          <option key={team.id} value={team.id}>
                            {team.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Subcampeón</label>
                      <select
                        value={formData.gold_second}
                        onChange={(e) => setFormData({ ...formData, gold_second: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg"
                      >
                        <option value="">Seleccionar equipo</option>
                        {teams.map(team => (
                          <option key={team.id} value={team.id}>
                            {team.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-gray-900 mb-3">División Plata</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium mb-1">Campeón</label>
                      <select
                        value={formData.silver_champion}
                        onChange={(e) => setFormData({ ...formData, silver_champion: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg"
                      >
                        <option value="">Seleccionar equipo</option>
                        {teams.map(team => (
                          <option key={team.id} value={team.id}>
                            {team.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Subcampeón</label>
                      <select
                        value={formData.silver_second}
                        onChange={(e) => setFormData({ ...formData, silver_second: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg"
                      >
                        <option value="">Seleccionar equipo</option>
                        {teams.map(team => (
                          <option key={team.id} value={team.id}>
                            {team.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Individual Awards */}
              <div>
                <h3 className="font-medium text-gray-900 mb-3">Premios Individuales</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Goleador</label>
                    <select
                      value={formData.topscorer}
                      onChange={(e) => setFormData({ ...formData, topscorer: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                    >
                      <option value="">Seleccionar jugador</option>
                      {Array.isArray(players) && players.map(player => (
                        <option key={player.id} value={player.id}>
                          {player.first_name} {player.last_name} ({player.expand?.team?.name || 'Sin equipo'})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Jugador del Torneo</label>
                    <select
                      value={formData.player_of_the_tournament}
                      onChange={(e) => setFormData({ ...formData, player_of_the_tournament: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                    >
                      <option value="">Seleccionar jugador</option>
                      {Array.isArray(players) && players.map(player => (
                        <option key={player.id} value={player.id}>
                          {player.first_name} {player.last_name} ({player.expand?.team?.name || 'Sin equipo'})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Mejor Arquero</label>
                    <select
                      value={formData.top_goalkeeper}
                      onChange={(e) => setFormData({ ...formData, top_goalkeeper: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                    >
                      <option value="">Seleccionar jugador</option>
                      {Array.isArray(players) && players.map(player => (
                        <option key={player.id} value={player.id}>
                          {player.first_name} {player.last_name} ({player.expand?.team?.name || 'Sin equipo'})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-2 mt-6">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  {editingEdition ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminEditions;
