import React, { useState, useEffect } from 'react';
import { Calendar, Trophy, Loader2, Plus, Save } from 'lucide-react';
import AdminMatchEvents from './AdminMatchEvents';
import AdminMatchResultModal from './AdminMatchResultModal';
import { fetchMatchdays, createMatchday, deleteMatchday } from '../../hooks/admin/matchdayHandlers';
import { fetchMatchesByMatchday, createMatch, updateMatch as updateMatchAPI } from '../../hooks/admin/matchHandlers';
import { pb } from '../../config';
import { updateTeamStatistics } from '../../utils/teamsUtils';
import { updatePlayerStatistics } from '../../utils/playersUtils';
import { toast } from 'react-toastify';
import { useTeams } from '../../hooks/teams/useTeams';

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
        "Are you sure you want to delete this matchday? This action cannot be undone and will delete all associated matches and events."
      );
      if (!isConfirmed) return;
      await deleteMatchday(matchdayId);
      setMatchdays(matchdays.filter(matchday => matchday.id !== matchdayId));
      toast.success('Matchday deleted successfully');
    } catch (err) {
      console.error('Error deleting matchday:', err);
      setError('Failed to delete matchday. Please try again.');
      toast.error('Failed to delete matchday');
    }
  };

  const handleDeleteMatch = async (matchdayIndex, matchIndex) => {
    try {
      const match = matchdays[matchdayIndex].matches[matchIndex];
      const isConfirmed = window.confirm(
        "Are you sure you want to delete this match? This action cannot be undone."
      );
      if (!isConfirmed) return;
      await pb.collection('matches').delete(match.id);
      const updatedMatchdays = matchdays.map((matchday, mdIndex) => {
        if (mdIndex === matchdayIndex) {
          return {
            ...matchday,
            matches: matchday.matches.filter((_, mIndex) => mIndex !== matchIndex)
          };
        }
        return matchday;
      });
      setMatchdays(updatedMatchdays);
      toast.success('Match deleted successfully');
    } catch (error) {
      console.error('Error deleting match:', error);
      toast.error('Failed to delete match');
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
          <div className="flex items-center space-x-3">
            <select
              value={selectedAdminPhase}
              onChange={(e) => setSelectedAdminPhase(e.target.value)}
              className="p-3 border rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {phaseOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            <button 
              onClick={handleCreateMatchday}
              className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-200"
            >
              <Calendar className="w-5 h-5" />
              <span>Generate New Matchday</span>
            </button>
          </div>
        </div>

        {filteredMatchdays.length === 0 ? (
          <div className="text-center py-4 text-gray-200">
            No matchdays scheduled for {phaseOptions.find(o => o.value === selectedAdminPhase)?.label}
          </div>
        ) : (
          filteredMatchdays.map((matchday, mdIndex) => (
            <div key={matchday.id} className="mb-8 bg-white/95 backdrop-blur rounded-lg shadow-xl overflow-hidden">
              <div className="bg-gray-800 text-white p-4 rounded-t-lg flex justify-between items-center">
                <div className="text-2xl font-bold flex items-center space-x-2">
                  <Calendar className="w-6 h-6" />
                  <span>
                    {phaseOptions.find(o => o.value === matchday.phase)?.label} - Jornada {matchday.number}
                  </span>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleSaveMatchdayStats(matchday.id, matchday.phase)}
                    disabled={savedMatchdays[matchday.id] === 'saving'}
                    className={`${
                      savedMatchdays[matchday.id] === 'saved'
                        ? 'bg-green-500 hover:bg-green-600'
                        : savedMatchdays[matchday.id] === 'error'
                        ? 'bg-red-500 hover:bg-red-600'
                        : 'bg-blue-500 hover:bg-blue-600'
                    } text-white font-bold py-2 px-4 rounded flex items-center space-x-1 transition-colors duration-200`}
                  >
                    <Save className="w-4 h-4" />
                    <span>
                      {savedMatchdays[matchday.id] === 'saving'
                        ? 'Saving...'
                        : savedMatchdays[matchday.id] === 'saved'
                        ? 'Saved!'
                        : savedMatchdays[matchday.id] === 'error'
                        ? 'Error!'
                        : 'Save Matchday'}
                    </span>
                  </button>
                  <button
                    onClick={() => handleAddMatch(matchday.id)}
                    className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded flex items-center space-x-1"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Match</span>
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
                    <div key={matchIndex} className="mb-4 p-4 bg-gray-50 rounded-lg shadow-inner flex flex-col md:flex-row md:items-center md:justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          {match.home_team_logo ? (
                            <img src={pb.getFileUrl({ id: match.home_team_id, collectionName: 'teams' }, match.home_team_logo)} alt={match.home_team} className="w-10 h-10 rounded-full" />
                          ) : (
                            <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                              {match.home_team}
                            </div>
                          )}
                          <span className="font-bold text-gray-800">{match.home_team}</span>
                        </div>
                        <span className="text-gray-600">vs</span>
                        <div className="flex items-center space-x-2">
                          {match.away_team_logo ? (
                            <img src={pb.getFileUrl({ id: match.away_team_id, collectionName: 'teams' }, match.away_team_logo)} alt={match.away_team} className="w-10 h-10 rounded-full" />
                          ) : (
                            <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                              {match.away_team}
                            </div>
                          )}
                          <span className="font-bold text-gray-800">{match.away_team}</span>
                        </div>
                      </div>
                      <div className="mt-4 md:mt-0">
                        <p className="text-gray-600">
                          {match.date_time ? new Date(match.date_time).toLocaleDateString() + ' ' + new Date(match.date_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'No date set'}
                        </p>
                        {match.is_finished && (
                          <p className="text-green-600 font-bold">
                            Result: {match.home_team_score} - {match.away_team_score}
                          </p>
                        )}
                      </div>
                      <div className="mt-4 md:mt-0 flex space-x-2">
                        <button
                          onClick={() => openEditResultModal(mdIndex, matchIndex)}
                          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
                        >
                          Edit Result
                        </button>
                        {match.is_finished && (
                          <button
                            onClick={() => openEventsModal(mdIndex, matchIndex)}
                            className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded"
                          >
                            Edit Events
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteMatch(mdIndex, matchIndex)}
                          className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded"
                        >
                          Delete Match
                        </button>
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
      </div>
    </div>
  );
};

export default AdminFixtures;
