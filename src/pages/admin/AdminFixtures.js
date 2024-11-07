import React, { useState, useEffect } from 'react';
import { useTeams } from '../../hooks/teams/useTeams';
import { Calendar, Trophy, Loader2, Plus, Save } from 'lucide-react';
import AdminMatchEvents from './AdminMatchEvents';
import { fetchMatchdays, createMatchday, deleteMatchday } from '../../hooks/admin/matchdayHandlers';
import { fetchMatchesByMatchday, createMatch, updateMatch as updateMatchAPI } from '../../hooks/admin/matchHandlers';
import { pb } from '../../config';
import { updateTeamStatistics } from '../../utils/teamsUtils';
import { toast } from 'react-toastify';

const AdminFixtures = () => {
  const [matchdays, setMatchdays] = useState([]);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [selectedMatchday, setSelectedMatchday] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [setError] = useState(null);
  const { teams, loading, error: teamsError } = useTeams();

  useEffect(() => {
    let mounted = true;
    const controller = new AbortController();
    
    const loadMatchdays = async () => {
      try {
        const fetchedMatchdays = await fetchMatchdays();
        
        if (!mounted) return;

        const sortedMatchdays = fetchedMatchdays.sort((a, b) => b.number - a.number);
        console.log('Sorted matchdays:', sortedMatchdays);

        const matchdaysWithMatches = await Promise.all(
          sortedMatchdays.map(async (matchday) => {
            try {
              const matches = await fetchMatchesByMatchday(matchday.id, controller.signal);
              if (!mounted) return { ...matchday, matches: [] };
              
              return {
                ...matchday,
                matches: matches || [],
              };
            } catch (err) {
              console.warn(`Failed to load matches for matchday ${matchday.id}:`, err);
              return {
                ...matchday,
                matches: [],
              };
            }
          })
        );
        
        if (mounted) {
          setMatchdays(matchdaysWithMatches.filter(Boolean));
        }
      } catch (err) {
        console.error('Error loading matchdays:', err);
        if (mounted) {
          setError('Failed to load matchdays. Please try again.');
        }
      }
    };

    loadMatchdays();

    return () => {
      mounted = false;
      controller.abort();
    };
  }, [setError]);

  const handleCreateMatchday = async () => {
    try {
      const { createdMatchday, updatedMatchdays } = await createMatchday({
        date_time: new Date().toISOString(),
      });

      // Transform the matchdays with their matches
      const matchdaysWithMatches = await Promise.all(
        updatedMatchdays.map(async (matchday) => {
          const matches = await fetchMatchesByMatchday(matchday.id);
          return {
            ...matchday,
            matches: matches || [],
          };
        })
      );

      setMatchdays(matchdaysWithMatches);
      setSelectedMatchday(createdMatchday.id);
      toast.success('New matchday created successfully');
    } catch (error) {
      console.error('Error creating matchday:', error);
      setError('Failed to create matchday. Please try again.');
      toast.error('Failed to create matchday');
    }
  };

  const handleMatchUpdate = async (matchdayIndex, matchIndex, field, value) => {
    try {
      const match = matchdays[matchdayIndex].matches[matchIndex];
      
      let updateData;
      
      if (field === 'is_finished') {
        updateData = {
          matchday: match.matchday,
          date_time: match.date_time || new Date().toISOString(),
          home_team: match.home_team_id || '',
          away_team: match.away_team_id || '',
          home_team_score: match.home_team_score || 0,
          away_team_score: match.away_team_score || 0,
          is_finished: value,
          events: match.events?.map(event => event.id) || []
        };
      } else if (field === 'home_team' || field === 'away_team') {
        updateData = {
          matchday: match.matchday,
          date_time: match.date_time || new Date().toISOString(),
          home_team: field === 'home_team' ? value : match.home_team_id || '',
          away_team: field === 'away_team' ? value : match.away_team_id || '',
          home_team_score: match.home_team_score || 0,
          away_team_score: match.away_team_score || 0,
          is_finished: match.is_finished || false,
          events: match.events?.map(event => event.id) || []
        };
      } else {
        updateData = {
          matchday: match.matchday,
          date_time: match.date_time || new Date().toISOString(),
          home_team: match.home_team_id || '',
          away_team: match.away_team_id || '',
          [field]: value,
          is_finished: match.is_finished || false,
          events: match.events?.map(event => event.id) || []
        };
      }
  
      const updatedMatch = await updateMatchAPI(match.id, updateData);
  
      const updatedMatchdays = matchdays.map((matchday, mdIndex) => 
        mdIndex === matchdayIndex
          ? {
              ...matchday,
              matches: matchday.matches.map((m, mIndex) => {
                if (mIndex === matchIndex) {
                  const homeTeam = teams.find(t => t.id === updatedMatch.home_team);
                  const awayTeam = teams.find(t => t.id === updatedMatch.away_team);
                  
                  return {
                    ...updatedMatch,
                    home_team: homeTeam?.name || '',
                    away_team: awayTeam?.name || '',
                    home_team_id: updatedMatch.home_team,
                    away_team_id: updatedMatch.away_team,
                    home_team_logo: homeTeam?.logo || '',
                    away_team_logo: awayTeam?.logo || ''
                  };
                }
                return m;
              })
            }
          : matchday
      );
      setMatchdays(updatedMatchdays);
    } catch (err) {
      console.error('Error updating match:', err);
      setError('Failed to update match. Please try again.');
    }
  };

  const updateMatchEvents = (matchdayIndex, matchIndex, events) => {
    const updatedMatchdays = matchdays.map((matchday, mdIndex) => 
      mdIndex === matchdayIndex
        ? {
            ...matchday,
            matches: matchday.matches.map((match, mIndex) => 
              mIndex === matchIndex ? { ...match, events } : match
            )
          }
        : matchday
    );
    setMatchdays(updatedMatchdays);
  };

  const toggleMatchStatus = async (matchdayIndex, matchIndex) => {
    const match = matchdays[matchdayIndex].matches[matchIndex];
    await handleMatchUpdate(matchdayIndex, matchIndex, 'is_finished', !match.is_finished);
    
    // If the match is being marked as finished, update team statistics
    if (!match.is_finished) {
      try {
        await updateTeamStatistics(match.matchday);
      } catch (error) {
        console.error('Error updating team statistics:', error);
        setError('Failed to update team statistics. Please try again.');
      }
    }
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
      const isConfirmed = window.confirm(
        "Are you sure you want to delete this matchday? This action cannot be undone and will delete all associated matches and events."
      );

      if (!isConfirmed) {
        return; // User cancelled the deletion
      }

      await deleteMatchday(matchdayId);
      setMatchdays(matchdays.filter(matchday => matchday.id !== matchdayId));
    } catch (err) {
      console.error('Error deleting matchday:', err);
      setError('Failed to delete matchday. Please try again.');
    }
  };

  const handleAddMatch = async (matchdayId, matchdayIndex) => {
    try {
      const newMatch = await createMatch(matchdayId);
      
      const updatedMatchdays = matchdays.map((matchday, index) => {
        if (index === matchdayIndex) {
          return {
            ...matchday,
            matches: Array.isArray(matchday.matches) 
              ? [...matchday.matches, {
                  ...newMatch,
                  home_team: '',
                  away_team: '',
                  home_team_logo: '',
                  away_team_logo: '',
                  home_team_id: '',
                  away_team_id: '',
                  events: []
                }]
              : [{
                  ...newMatch,
                  home_team: '',
                  away_team: '',
                  home_team_logo: '',
                  away_team_logo: '',
                  home_team_id: '',
                  away_team_id: '',
                  events: []
                }]
          };
        }
        return matchday;
      });
      
      setMatchdays(updatedMatchdays);
    } catch (err) {
      console.error('Error adding match:', err);
      setError('Failed to add match. Please try again.');
    }
  };

  const handleSaveMatchday = async () => {
    try {
      console.log('Starting team statistics update');
      
      // Update all team statistics
      const result = await updateTeamStatistics();
      
      if (result) {
        console.log('Team statistics updated successfully');
        toast.success('Team statistics updated successfully');
      } else {
        console.log('No updates were necessary');
        toast.info('No finished matches to update');
      }
    } catch (error) {
      console.error('Error updating team statistics:', error);
      toast.error('Failed to update team statistics');
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

  if (teamsError) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-500 text-center">
          <p className="text-xl font-bold">Error loading teams</p>
          <p className="mt-2">{teamsError}</p>
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
            onClick={handleCreateMatchday}
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
              <div className="flex space-x-2">
                <button
                  onClick={() => handleAddMatch(matchday.id, mdIndex)}
                  className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded flex items-center space-x-1"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Match</span>
                </button>
                <button
                  onClick={() => handleSaveMatchday(matchday.id)}
                  className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded flex items-center space-x-1"
                >
                  <Save className="w-4 h-4" />
                  <span>Save</span>
                </button>
                <button
                  onClick={() => handleDeleteMatchday(matchday.id)}
                  className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded"
                >
                  Delete
                </button>
              </div>
            </div>

            <div className="p-6">
              {matchday.matches && matchday.matches.length > 0 ? (
                matchday.matches.map((match, matchIndex) => (
                  <div key={matchIndex} className="mb-4 last:mb-0">
                    {match.away_team === 'FREE' ? (
                      <div className="bg-gray-50 p-6 rounded-lg shadow-inner">
                        <div className="flex items-center justify-center space-x-3">
                          <select
                            className="p-3 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            value={match.home_team_id || ""}
                            onChange={(e) => handleMatchUpdate(mdIndex, matchIndex, 'home_team', e.target.value)}
                          >
                            <option value="">Select Free Team</option>
                            {teams.map((team) => (
                              <option key={team.id} value={team.id}>
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
                            {match.home_team && (
                              <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden">
                                <img
                                  src={match.home_team_logo 
                                    ? pb.getFileUrl({ collectionId: '6hkvwfswk61t3b1', collectionName: 'teams', id: match.home_team_id }, match.home_team_logo)
                                    : ''}
                                  alt={match.home_team}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            )}
                              <select
                                className="flex-1 p-3 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                value={match.home_team_id || ""}
                                onChange={(e) => handleMatchUpdate(mdIndex, matchIndex, 'home_team', e.target.value)}
                                disabled={match.is_finished}
                              >
                                <option value="">Select Home Team</option>
                                {teams.map((team) => (
                                  <option key={team.id} value={team.id}>
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
                              value={match.home_team_score || 0}
                              onChange={(e) => handleMatchUpdate(mdIndex, matchIndex, 'home_team_score', parseInt(e.target.value) || 0)}
                              disabled={match.is_finished}
                              min="0"
                            />
                            <span className="text-2xl font-bold text-white">:</span>
                            <input
                              type="number"
                              placeholder="0"
                              className="w-16 h-12 text-center text-2xl font-bold bg-gray-900 text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                              value={match.away_team_score || 0}
                              onChange={(e) => handleMatchUpdate(mdIndex, matchIndex, 'away_team_score', parseInt(e.target.value) || 0)}
                              disabled={match.is_finished}
                              min="0"
                            />
                          </div>
                          {/* Away Team */}
                          <div className="flex-1">
                            <div className="flex items-center justify-end space-x-3">
                              <select
                                className="flex-1 p-3 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                value={match.away_team_id || ""}
                                onChange={(e) => handleMatchUpdate(mdIndex, matchIndex, 'away_team', e.target.value)}
                                disabled={match.is_finished}
                              >
                                <option value="">Select Away Team</option>
                                {teams.map((team) => (
                                  <option key={team.id} value={team.id}>
                                    {team.name}
                                  </option>
                                ))}
                              </select>
                              {match.away_team && match.away_team !== 'FREE' && (
                                <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden">
                                  <img
                                    src={match.away_team_logo 
                                      ? pb.getFileUrl({ collectionId: '6hkvwfswk61t3b1', collectionName: 'teams', id: match.away_team_id }, match.away_team_logo)
                                      : ''}
                                    alt={match.away_team}
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
                              match.is_finished
                                ? 'bg-yellow-500 hover:bg-yellow-600'
                                : 'bg-blue-500 hover:bg-blue-600'
                            } text-white font-bold py-2 px-4 rounded`}
                          >
                            {match.is_finished ? 'Edit Match' : 'End Match'}
                          </button>
                          <button
                            onClick={() => openEditEventsModal(mdIndex, matchIndex)}
                            disabled={!match.home_team || !match.away_team}
                            className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Edit Match Events
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-gray-500">
                  No matches scheduled for this matchday yet
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Match Events Modal */}
        {isModalOpen && selectedMatch && (
          <AdminMatchEvents
            match={matchdays[selectedMatch.matchdayIndex].matches[selectedMatch.matchIndex]}
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