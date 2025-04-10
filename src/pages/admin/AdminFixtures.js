import React, { useState, useEffect } from 'react';
import { Calendar, Trophy, Loader2, Plus, Save, Edit } from 'lucide-react';
import AdminMatchEvents from './AdminMatchEvents';
import AdminMatchResultModal from './AdminMatchResultModal';
import { fetchMatchdays, createMatchday, deleteMatchday } from '../../hooks/admin/matchdayHandlers';
import { fetchMatchesByMatchday, createMatch, updateMatch as updateMatchAPI } from '../../hooks/admin/matchHandlers';
import { pb } from '../../config';
import { updateTeamStatistics } from '../../utils/teamsUtils';
import { updatePlayerStatistics } from '../../utils/playersUtils';
import { toast } from 'react-toastify';
import { useTeams } from '../../hooks/teams/useTeams';
import AdminMatchdayModal from './AdminMatchdayModal';
import { updateGroupStats } from '../../utils/groupUtils';

const phaseOptions = [
  { label: "Group A", value: "group_a" },
  { label: "Group B", value: "group_b" },
  { label: "Gold Group", value: "gold_group" },
  { label: "Silver Group", value: "silver_group" },
  { label: "Bronze Group", value: "bronze_group" },
  { label: "Semifinal Gold", value: "gold_semi" },
  { label: "Semifinal Silver", value: "silver_semi" },
  { label: "Semifinal Bronze", value: "bronze_semi" },
  { label: "Final Gold", value: "gold_final" },
  { label: "Final Silver", value: "silver_final" },
  { label: "Final Bronze", value: "bronze_final" },
];

// Helper to convert a matchday phase to a stage (for team stats update)
const getStageFromPhase = (phase) => {
  if (phase === 'group_a' || phase === 'group_b') return 'group_phase';
  if (phase === 'gold_group' || phase === 'silver_group' || phase === 'bronze_group') return 'playoffs';
  if (phase === 'gold_semi' || phase === 'silver_semi' || phase === 'bronze_semi') return 'semifinals';
  if (phase === 'gold_final' || phase === 'silver_final' || phase === 'bronze_final') return 'finals';
  return '';
};

const AdminFixtures = () => {
  const [matchdays, setMatchdays] = useState([]);
  const [selectedResultMatch, setSelectedResultMatch] = useState(null); // { matchdayIndex, matchIndex }
  const [selectedMatchday, setSelectedMatchday] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false); // (for events modal, if still used)
  const [error, setError] = useState(null);
  const { teams, loading, error: teamsError } = useTeams();

  // Use a single phase dropdown for filtering and creation.
  const [selectedAdminPhase, setSelectedAdminPhase] = useState(phaseOptions[0].value);

  // Add this state at the top with other states
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [savedMatchdays, setSavedMatchdays] = useState({}); // Track saved state for each matchday
  const [editingMatchday, setEditingMatchday] = useState(null);

  useEffect(() => {
    let mounted = true;
    const controller = new AbortController();
    
    const loadMatchdays = async () => {
      try {
        const fetchedMatchdays = await fetchMatchdays();
        if (!mounted) return;
        const sortedMatchdays = fetchedMatchdays.sort((a, b) => b.number - a.number);
        // Load matches for each matchday
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
  }, []);

  // Filter matchdays by the currently selected phase and sort by number (newest first)
  const filteredMatchdays = matchdays
    .filter(matchday => matchday.phase === selectedAdminPhase)
    .sort((a, b) => b.number - a.number);

  const handleCreateMatchday = async () => {
    try {
      const { createdMatchday, updatedMatchdays } = await createMatchday({
        date_time: new Date().toISOString(),
        phase: selectedAdminPhase,
      });
      // Load matches for the updated matchdays
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

  const handleAddMatch = async (matchdayId) => {
    try {
      const createdMatch = await createMatch(matchdayId);
      
      // Update the local state to include the new match
      const updatedMatchdays = matchdays.map(matchday => {
        if (matchday.id === matchdayId) {
          return {
            ...matchday,
            matches: [...matchday.matches, {
              ...createdMatch,
              home_team: '', // will be enriched later
              away_team: '',
              home_team_id: '', // empty until updated
              away_team_id: '',
              home_team_logo: '',
              away_team_logo: ''
            }]
          };
        }
        return matchday;
      });
      
      setMatchdays(updatedMatchdays);
      toast.success('New match added successfully');
    } catch (error) {
      console.error('Error adding match:', error);
      toast.error('Failed to add match');
    }
  };

  const handleResultSave = async (matchdayIndex, matchIndex, updatedData) => {
    try {
      const match = matchdays[matchdayIndex].matches[matchIndex];
      if (!match || !match.id) {
        throw new Error('Invalid match selected');
      }

      // Build update data combining the modal's data with the existing match info
      const updateData = {
        matchday: match.matchday,
        date_time: updatedData.date_time || match.date_time || new Date().toISOString(),
        home_team: updatedData.home_team || match.home_team_id || '',
        away_team: updatedData.away_team || match.away_team_id || '',
        home_team_score: (updatedData.home_team_score !== undefined) 
          ? Number(updatedData.home_team_score) 
          : (match.home_team_score || 0),
        away_team_score: (updatedData.away_team_score !== undefined)
          ? Number(updatedData.away_team_score)
          : (match.away_team_score || 0),
        is_finished: updatedData.is_finished ?? match.is_finished ?? false,
        events: match.events?.map(event => event.id) || []
      };

      if (updatedData.home_penalties !== undefined) {
        updateData.home_penalties = Number(updatedData.home_penalties);
      }
      if (updatedData.away_penalties !== undefined) {
        updateData.away_penalties = Number(updatedData.away_penalties);
      }

      const updatedMatch = await updateMatchAPI(match.id, updateData);

      // Update local state using match ID instead of indices
      const updatedMatchdays = matchdays.map(matchday => ({
        ...matchday,
        matches: matchday.matches.map(m => {
          if (m.id === match.id) {
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
      }));

      setMatchdays(updatedMatchdays);
      toast.success('Match updated successfully');
    } catch (err) {
      console.error('Error updating match:', err);
      toast.error('Failed to update match: ' + err.message);
    }
  };

  const handleDeleteMatchday = async (matchdayId) => {
    try {
      const isConfirmed = window.confirm(
        "¿Estás seguro de que quieres eliminar esta jornada? Esta acción no se puede deshacer y eliminará todos los partidos y eventos asociados."
      );
      
      if (!isConfirmed) return;

      // First get all matches for this matchday
      const matches = await pb.collection('matches').getFullList({
        filter: `matchday="${matchdayId}"`
      });

      // Delete all events for each match
      for (const match of matches) {
        const events = await pb.collection('events').getFullList({
          filter: `match="${match.id}"`
        });
        
        // Delete each event
        for (const event of events) {
          await pb.collection('events').delete(event.id);
        }
        
        // Delete the match
        await pb.collection('matches').delete(match.id);
      }

      // Finally delete the matchday
      await pb.collection('matchdays').delete(matchdayId);
      
      // Refresh the matchdays list
      const updatedMatchdays = await fetchMatchdays();
      setMatchdays(updatedMatchdays);
      
      toast.success('Jornada eliminada correctamente');
    } catch (error) {
      console.error('Error deleting matchday:', error);
      toast.error('Error al eliminar la jornada');
    }
  };

  const handleDeleteMatch = async (matchdayIndex, matchIndex) => {
    try {
      // Get the match from the filtered matchdays array since that's what we're displaying
      const match = filteredMatchdays[matchdayIndex]?.matches[matchIndex];
      
      if (!match || !match.id) {
        console.error('Match not found:', { matchdayIndex, matchIndex });
        toast.error('Error: Match not found');
        return;
      }

      const isConfirmed = window.confirm(
        "¿Estás seguro de que quieres eliminar este partido? Esta acción no se puede deshacer."
      );
      
      if (!isConfirmed) return;

      // Get the matchday data to know which phase we're in
      const matchdayData = await pb.collection('matchdays').getOne(match.matchday);

      // Delete all events associated with this match first
      const events = await pb.collection('events').getFullList({
        filter: `match="${match.id}"`
      });
      
      for (const event of events) {
        await pb.collection('events').delete(event.id);
      }

      // Then delete the match
      await pb.collection('matches').delete(match.id);

      // Update the local state using the matchday ID to ensure we update the correct matchday
      const updatedMatchdays = matchdays.map(matchday => {
        if (matchday.id === filteredMatchdays[matchdayIndex].id) {
          return {
            ...matchday,
            matches: matchday.matches.filter(m => m.id !== match.id)
          };
        }
        return matchday;
      });

      setMatchdays(updatedMatchdays);

      // If the match was finished, update group stats
      if (match.is_finished) {
        await updateGroupStats();
      }

      toast.success('Partido eliminado correctamente');
    } catch (error) {
      console.error('Error deleting match:', error);
      toast.error('Error al eliminar el partido');
    }
  };

  const openEditResultModal = (matchdayIndex, matchIndex) => {
    // Get the actual matchday from the filtered array
    const matchday = filteredMatchdays[matchdayIndex];
    if (!matchday || !matchday.matches[matchIndex]) {
      console.error('Match not found:', { matchdayIndex, matchIndex });
      toast.error('Error: Match not found');
      return;
    }
    setSelectedResultMatch({ matchdayIndex, matchIndex });
  };

  const closeEditResultModal = () => {
    setSelectedResultMatch(null);
  };

  const handleSaveMatchdayStats = async (matchdayId, matchdayPhase) => {
    try {
      setSavedMatchdays(prev => ({ ...prev, [matchdayId]: 'saving' }));
      
      // First update team statistics
      const stage = getStageFromPhase(matchdayPhase);
      const teamStatsResult = await updateTeamStatistics(stage);
      
      // Then update player statistics
      const playerStatsResult = await updatePlayerStatistics();

      if (teamStatsResult && playerStatsResult) {
        toast.success('Team and player statistics updated successfully');
        setSavedMatchdays(prev => ({ ...prev, [matchdayId]: 'saved' }));
        
        // Reset the saved state after 3 seconds
        setTimeout(() => {
          setSavedMatchdays(prev => ({ ...prev, [matchdayId]: null }));
        }, 3000);
      } else if (teamStatsResult) {
        toast.info('Team statistics updated, but no player statistics to update');
        setSavedMatchdays(prev => ({ ...prev, [matchdayId]: 'saved' }));
      } else if (playerStatsResult) {
        toast.info('Player statistics updated, but no team statistics to update');
        setSavedMatchdays(prev => ({ ...prev, [matchdayId]: 'saved' }));
      } else {
        toast.info('No finished matches to update');
        setSavedMatchdays(prev => ({ ...prev, [matchdayId]: null }));
      }
    } catch (error) {
      console.error('Error updating statistics:', error);
      toast.error('Failed to update statistics: ' + error.message);
      setSavedMatchdays(prev => ({ ...prev, [matchdayId]: 'error' }));
    }
  };

  // Helper to enrich a match object with team names using the teams array.
  const enrichMatch = (match) => {
    return {
      ...match,
      home_team: teams.find(t => t.id === match.home_team_id) || { id: match.home_team_id, name: match.home_team },
      away_team: teams.find(t => t.id === match.away_team_id) || { id: match.away_team_id, name: match.away_team }
    };
  };

  // Add this function to handle opening the events modal
  const openEventsModal = (matchdayIndex, matchIndex) => {
    // We need to use the filtered matchdays since that's what we're displaying
    const match = filteredMatchdays[matchdayIndex].matches[matchIndex];
    if (!match) {
      console.error('Match not found:', { matchdayIndex, matchIndex });
      toast.error('Error: Match not found');
      return;
    }
    
    // Find the actual index in the full matchdays array
    const fullMatchdayIndex = matchdays.findIndex(md => md.id === filteredMatchdays[matchdayIndex].id);
    if (fullMatchdayIndex !== -1) {
      setSelectedMatch({ 
        matchdayIndex: fullMatchdayIndex, // Use the index from full array
        matchIndex: matchIndex 
      });
      setIsModalOpen(true);
    }
  };

  const handleMatchdayUpdate = async (matchdayId, updatedData) => {
    try {
      // Log the update attempt
      console.log('Attempting to update matchday:', { matchdayId, updatedData });
      
      // Update the matchday in the database
      const updated = await pb.collection('matchdays').update(matchdayId, updatedData);
      console.log('Update response:', updated);
      
      // Update local state
      const updatedMatchdays = matchdays.map(matchday => {
        if (matchday.id === matchdayId) {
          return {
            ...matchday,
            ...updatedData
          };
        }
        return matchday;
      });
      
      setMatchdays(updatedMatchdays);
      setEditingMatchday(null);
      toast.success('Matchday updated successfully');
    } catch (error) {
      // More detailed error logging
      console.error('Error updating matchday:', {
        error,
        message: error.message,
        data: error.data,
        status: error.status
      });
      
      // More informative error message to the user
      toast.error(
        error.data?.message || 
        error.message || 
        'Failed to update matchday. Please try again.'
      );
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
    <div className="min-h-screen bg-gradient-to-br from-green-900 to-green-800 p-2 sm:p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row items-center justify-between mb-4 sm:mb-8 space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-3 w-full sm:w-auto">
            <Trophy className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-400" />
            <h1 className="text-xl sm:text-3xl font-bold text-white">Match Schedule</h1>
          </div>
          <div className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-3 w-full sm:w-auto">
            <select
              value={selectedAdminPhase}
              onChange={(e) => setSelectedAdminPhase(e.target.value)}
              className="w-full sm:w-auto p-2 sm:p-3 border rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {phaseOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            <button 
              onClick={handleCreateMatchday}
              className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 sm:py-3 px-4 sm:px-6 rounded-lg transition-colors duration-200"
            >
              <Calendar className="w-5 h-5" />
              <span>New Matchday</span>
            </button>
          </div>
        </div>

        {filteredMatchdays.length === 0 ? (
          <div className="text-center py-4 text-gray-200">
            No matchdays scheduled for {phaseOptions.find(o => o.value === selectedAdminPhase)?.label}
          </div>
        ) : (
          filteredMatchdays.map((matchday, mdIndex) => (
            <div key={matchday.id} className="mb-4 sm:mb-8 bg-white/95 backdrop-blur rounded-lg shadow-xl overflow-hidden">
              <div className="bg-gray-800 text-white p-3 sm:p-4 rounded-t-lg">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-3 sm:space-y-0">
                  <div className="flex items-center space-x-2 w-full sm:w-auto">
                    <Calendar className="w-5 h-5 sm:w-6 sm:h-6" />
                    <span className="text-lg sm:text-2xl font-bold truncate">
                      {phaseOptions.find(o => o.value === matchday.phase)?.label} - J{matchday.number}
                    </span>
                    {matchday.date_time ? (
                      <button
                        onClick={() => setEditingMatchday(matchday)}
                        className="ml-2 sm:ml-4 text-sm sm:text-base text-gray-300 hover:text-white hover:underline flex items-center space-x-1"
                      >
                        <span>
                          {new Date(matchday.date_time).toISOString().slice(0, 10)}
                        </span>
                        <Edit className="w-3 h-3 inline-block ml-1" />
                      </button>
                    ) : (
                      <button
                        onClick={() => setEditingMatchday(matchday)}
                        className="ml-2 sm:ml-4 text-sm sm:text-base text-gray-400 hover:text-white hover:underline flex items-center space-x-1"
                      >
                        <span>Set date</span>
                        <Edit className="w-3 h-3 inline-block ml-1" />
                      </button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                    <button
                      onClick={() => handleSaveMatchdayStats(matchday.id, matchday.phase)}
                      disabled={savedMatchdays[matchday.id] === 'saving'}
                      className={`flex-1 sm:flex-none ${
                        savedMatchdays[matchday.id] === 'saved'
                          ? 'bg-green-500 hover:bg-green-600'
                          : savedMatchdays[matchday.id] === 'error'
                          ? 'bg-red-500 hover:bg-red-600'
                          : 'bg-blue-500 hover:bg-blue-600'
                      } text-white font-bold py-2 px-3 sm:px-4 rounded text-sm sm:text-base flex items-center justify-center space-x-1 transition-colors duration-200`}
                    >
                      <Save className="w-4 h-4" />
                      <span>
                        {savedMatchdays[matchday.id] === 'saving'
                          ? 'Saving...'
                          : savedMatchdays[matchday.id] === 'saved'
                          ? 'Saved!'
                          : savedMatchdays[matchday.id] === 'error'
                          ? 'Error!'
                          : 'Save'}
                      </span>
                    </button>
                    <button
                      onClick={() => handleAddMatch(matchday.id)}
                      className="flex-1 sm:flex-none bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-3 sm:px-4 rounded text-sm sm:text-base flex items-center justify-center space-x-1"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Match</span>
                    </button>
                    <button
                      onClick={() => handleDeleteMatchday(matchday.id)}
                      className="flex-1 sm:flex-none bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-3 sm:px-4 rounded text-sm sm:text-base"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
              <div className="p-3 sm:p-6">
                {matchday.matches && matchday.matches.length > 0 ? (
                  matchday.matches.map((match, matchIndex) => (
                    <div key={matchIndex} className="mb-4 p-3 sm:p-4 bg-gray-50 rounded-lg shadow-inner">
                      <div className="flex flex-col space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0">
                          <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                            <div className="flex items-center justify-center w-6 h-6 bg-gray-800 rounded-full text-white text-sm font-bold">
                              {matchIndex + 1}
                            </div>
                            <div className="flex items-center space-x-2">
                              {match.home_team_logo ? (
                                <img src={pb.getFileUrl({ id: match.home_team_id, collectionName: 'teams' }, match.home_team_logo)} alt={match.home_team} className="w-8 sm:w-10 h-8 sm:h-10 rounded-full" />
                              ) : (
                                <div className="w-8 sm:w-10 h-8 sm:h-10 bg-gray-300 rounded-full flex items-center justify-center text-xs sm:text-sm">
                                  {match.home_team?.substring(0, 2)}
                                </div>
                              )}
                              <span className="font-bold text-gray-800 text-sm sm:text-base">{match.home_team}</span>
                            </div>
                            <span className="text-gray-600">vs</span>
                            <div className="flex items-center space-x-2">
                              {match.away_team_logo ? (
                                <img src={pb.getFileUrl({ id: match.away_team_id, collectionName: 'teams' }, match.away_team_logo)} alt={match.away_team} className="w-8 sm:w-10 h-8 sm:h-10 rounded-full" />
                              ) : (
                                <div className="w-8 sm:w-10 h-8 sm:h-10 bg-gray-300 rounded-full flex items-center justify-center text-xs sm:text-sm">
                                  {match.away_team?.substring(0, 2)}
                                </div>
                              )}
                              <span className="font-bold text-gray-800 text-sm sm:text-base">{match.away_team}</span>
                            </div>
                          </div>
                          <div className="text-sm sm:text-base">
                            <p className="text-gray-600">
                              {match.date_time ? new Date(match.date_time).toLocaleDateString() + ' ' + new Date(match.date_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'No date set'}
                            </p>
                            {match.is_finished && (
                              <p className="text-green-600 font-bold">
                                Result: {match.home_team_score} - {match.away_team_score}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => openEditResultModal(mdIndex, matchIndex)}
                            className="flex-1 sm:flex-none bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-3 sm:px-4 rounded text-sm sm:text-base"
                          >
                            Edit Result
                          </button>
                          {match.is_finished && (
                            <button
                              onClick={() => openEventsModal(mdIndex, matchIndex)}
                              className="flex-1 sm:flex-none bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-3 sm:px-4 rounded text-sm sm:text-base"
                            >
                              Edit Events
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteMatch(mdIndex, matchIndex)}
                            className="flex-1 sm:flex-none bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-3 sm:px-4 rounded text-sm sm:text-base"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    No matches scheduled for this matchday yet.
                  </div>
                )}
              </div>
            </div>
          ))
        )}

        {/* Update the events modal section */}
        {isModalOpen && selectedMatch && (
          <AdminMatchEvents
            // Enrich the match object with team names before passing it on
            match={enrichMatch(matchdays[selectedMatch.matchdayIndex].matches[selectedMatch.matchIndex])}
            onClose={() => {
              setIsModalOpen(false);
              setSelectedMatch(null);
            }}
            updateMatchEvents={async (events) => {
              try {
                // Update the local state with new events
                const updatedMatchdays = [...matchdays];
                updatedMatchdays[selectedMatch.matchdayIndex].matches[selectedMatch.matchIndex].events = events;
                setMatchdays(updatedMatchdays);
                toast.success('Match events updated successfully');
              } catch (error) {
                console.error('Error updating match events:', error);
                toast.error('Failed to update match events');
              }
            }}
          />
        )}

        {/* Render the result modal when a match is selected for editing */}
        {selectedResultMatch && (
          <AdminMatchResultModal
            match={filteredMatchdays[selectedResultMatch.matchdayIndex]?.matches[selectedResultMatch.matchIndex]}
            teams={teams}
            onSave={(updatedData) => {
              // Find the actual index in the full matchdays array
              const fullMatchdayIndex = matchdays.findIndex(
                md => md.id === filteredMatchdays[selectedResultMatch.matchdayIndex].id
              );
              if (fullMatchdayIndex !== -1) {
                handleResultSave(fullMatchdayIndex, selectedResultMatch.matchIndex, updatedData);
              }
              closeEditResultModal();
            }}
            onCancel={closeEditResultModal}
          />
        )}

        {editingMatchday && (
          <AdminMatchdayModal
            matchday={editingMatchday}
            onSave={(updatedData) => handleMatchdayUpdate(editingMatchday.id, updatedData)}
            onCancel={() => setEditingMatchday(null)}
          />
        )}
      </div>
    </div>
  );
};

export default AdminFixtures;
