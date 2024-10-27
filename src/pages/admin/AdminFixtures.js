import React, { useState, useEffect } from 'react';
import { useTeams } from '../../hooks/teams/useTeams';
import { Calendar, Trophy, Loader2 } from 'lucide-react';
import AdminMatchEvents from './AdminMatchEvents';
import { fetchMatchdays, createMatchday, deleteMatchday } from '../../hooks/admin/matchdayHandlers'; // Import matchday handlers

const AdminFixtures = () => {
  const [matchdays, setMatchdays] = useState([]);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { teams, loading, error } = useTeams();

  useEffect(() => {
    const loadMatchdays = async () => {
      try {
        const fetchedMatchdays = await fetchMatchdays();
        setMatchdays(fetchedMatchdays);
      } catch (err) {
        console.error('Error loading matchdays:', err);
      }
    };

    loadMatchdays();
  }, []);

  const generateMatchday = async () => {
    try {
      const newMatchday = await createMatchday({ date_time: new Date().toISOString() });
      setMatchdays([...matchdays, newMatchday]);
    } catch (err) {
      console.error('Error creating matchday:', err);
    }
  };

  const updateMatch = (matchdayIndex, matchIndex, field, value) => {
    const updatedMatchdays = matchdays.map((matchday, mdIndex) => 
      mdIndex === matchdayIndex
        ? matchday.map((match, mIndex) => 
            mIndex === matchIndex ? { ...match, [field]: value } : match
          )
        : matchday
    );
    setMatchdays(updatedMatchdays);
  };

  const updateMatchEvents = (matchdayIndex, matchIndex, events) => {
    const updatedMatchdays = matchdays.map((matchday, mdIndex) => 
      mdIndex === matchdayIndex
        ? matchday.map((match, mIndex) => 
            mIndex === matchIndex ? { ...match, events } : match
          )
        : matchday
    );
    setMatchdays(updatedMatchdays);
  };

  const toggleMatchStatus = (matchdayIndex, matchIndex) => {
    updateMatch(matchdayIndex, matchIndex, 'finished', !matchdays[matchdayIndex][matchIndex].finished);
  };

  const openEditEventsModal = (matchdayIndex, matchIndex) => {
    setSelectedMatch({ matchdayIndex, matchIndex });
    setIsModalOpen(true);
  };

  const closeEditEventsModal = () => {
    setIsModalOpen(false);
    setSelectedMatch(null);
  };

  const handleDeleteMatchday = async (matchdayId) => {
    try {
      await deleteMatchday(matchdayId);
      setMatchdays(matchdays.filter(matchday => matchday.id !== matchdayId));
    } catch (err) {
      console.error('Error deleting matchday:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <span className="ml-2 text-lg">Loading teams...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-500 text-center">
          <p className="text-xl font-bold">Error loading teams</p>
          <p className="mt-2">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 to-green-800 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <Trophy className="w-8 h-8 text-yellow-400" />
            <h1 className="text-3xl font-bold text-white">Match Schedule Manager</h1>
          </div>
          <button 
            onClick={generateMatchday}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-200"
          >
            <Calendar className="w-5 h-5" />
            <span>Generate New Matchday</span>
          </button>
        </div>

        {matchdays.map((matchday, mdIndex) => (
          <div key={matchday.id} className="mb-8 bg-white/95 backdrop-blur rounded-lg shadow-xl overflow-hidden">
            <div className="bg-gray-800 text-white p-4 rounded-t-lg flex justify-between items-center">
              <div className="text-2xl font-bold flex items-center space-x-2">
                <Calendar className="w-6 h-6" />
                <span>Matchday {matchday.number}</span>
              </div>
              <button
                onClick={() => handleDeleteMatchday(matchday.id)}
                className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded"
              >
                Delete
              </button>
            </div>

            <div className="p-6">
              {matchday.map((match, matchIndex) => (
                <div key={matchIndex} className="mb-4 last:mb-0">
                  {match.awayTeam === 'Free' ? (
                    <div className="bg-gray-50 p-6 rounded-lg shadow-inner">
                      <div className="flex items-center justify-center space-x-3">
                        <select
                          className="p-3 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          value={match.homeTeam}
                          onChange={(e) => updateMatch(mdIndex, matchIndex, 'homeTeam', e.target.value)}
                        >
                          <option value="">Select Free Team</option>
                          {teams.map((team) => (
                            <option key={team.id} value={team.name}>
                              {team.name}
                            </option>
                          ))}
                        </select>
                        <p className="text-center text-gray-700 font-medium">
                          has a bye week.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gray-50 p-6 rounded-lg shadow-inner">
                      <div className="flex items-center justify-between space-x-4">
                        {/* Home Team */}
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            {match.homeTeam && (
                              <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden">
                                <img
                                  src={teams.find(team => team.name === match.homeTeam)?.logoUrl}
                                  alt={match.homeTeam}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            )}
                            <select
                              className="flex-1 p-3 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              value={match.homeTeam}
                              onChange={(e) => updateMatch(mdIndex, matchIndex, 'homeTeam', e.target.value)}
                              disabled={match.finished}
                            >
                              <option value="">Select Home Team</option>
                              {teams.map((team) => (
                                <option key={team.id} value={team.name}>
                                  {team.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* Score Section */}
                        <div className="flex items-center space-x-4 bg-gray-800 rounded-xl px-6 py-3">
                          <input
                            type="number"
                            placeholder="0"
                            className="w-16 h-12 text-center text-2xl font-bold bg-gray-900 text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                            value={match.homeScore}
                            onChange={(e) => updateMatch(mdIndex, matchIndex, 'homeScore', e.target.value)}
                            disabled={match.finished}
                            min="0"
                          />
                          <span className="text-2xl font-bold text-white">:</span>
                          <input
                            type="number"
                            placeholder="0"
                            className="w-16 h-12 text-center text-2xl font-bold bg-gray-900 text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                            value={match.awayScore}
                            onChange={(e) => updateMatch(mdIndex, matchIndex, 'awayScore', e.target.value)}
                            disabled={match.finished}
                            min="0"
                          />
                        </div>

                        {/* Away Team */}
                        <div className="flex-1">
                          <div className="flex items-center justify-end space-x-3">
                            <select
                              className="flex-1 p-3 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              value={match.awayTeam}
                              onChange={(e) => updateMatch(mdIndex, matchIndex, 'awayTeam', e.target.value)}
                              disabled={match.finished}
                            >
                              <option value="">Select Away Team</option>
                              {teams.map((team) => (
                                <option key={team.id} value={team.name}>
                                  {team.name}
                                </option>
                              ))}
                            </select>
                            {match.awayTeam && match.awayTeam !== 'Free' && (
                              <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden">
                                <img
                                  src={teams.find(team => team.name === match.awayTeam)?.logoUrl}
                                  alt={match.awayTeam}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Match Events Summary */}
                      {match.events && match.events.length > 0 && (
                        <div className="mt-4 p-4 bg-gray-100 rounded-lg">
                          <h4 className="text-sm font-semibold text-gray-600 mb-2">Match Events</h4>
                          <div className="flex flex-wrap gap-2">
                            {match.events.map(event => (
                              <div
                                key={event.id}
                                className={`text-xs px-2 py-1 rounded-full ${
                                  event.team === 'home' ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'
                                }`}
                              >
                                {event.minute}' - {event.player} ({event.type})
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Match Controls */}
                      <div className="flex justify-between mt-4">
                        <button
                          onClick={() => toggleMatchStatus(mdIndex, matchIndex)}
                          className={`${
                            match.finished
                              ? 'bg-yellow-500 hover:bg-yellow-600'
                              : 'bg-blue-500 hover:bg-blue-600'
                          } text-white font-bold py-2 px-4 rounded`}
                        >
                          {match.finished ? 'Edit Match' : 'End Match'}
                        </button>
                        <button
                          onClick={() => openEditEventsModal(mdIndex, matchIndex)}
                          disabled={!match.homeTeam || !match.awayTeam}
                          className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Edit Match Events
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Match Events Modal */}
        {isModalOpen && selectedMatch && (
          <AdminMatchEvents
            match={matchdays[selectedMatch.matchdayIndex][selectedMatch.matchIndex]}
            matchdayIndex={selectedMatch.matchdayIndex}
            matchIndex={selectedMatch.matchIndex}
            onClose={closeEditEventsModal}
            updateMatchEvents={updateMatchEvents}
          />
        )}
      </div>
    </div>
  );
};

export default AdminFixtures;
