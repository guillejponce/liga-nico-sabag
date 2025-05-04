import React, { useState, useEffect } from 'react';
import { pb } from '../../config';
import { updateGroupStats } from '../../utils/groupUtils';
import { getTeamsByPhase } from '../../utils/groupUtils';
import LoadingSpinner from '../../components/LoadingSpinner';
import { updatePlayerStatistics } from '../../utils/playersUtils';

const AdminMatchResultModal = ({ match, onSave, onCancel }) => {
  const [homeTeam, setHomeTeam] = useState('');
  const [awayTeam, setAwayTeam] = useState('');
  const [homeScore, setHomeScore] = useState('');
  const [awayScore, setAwayScore] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [loading, setLoading] = useState(false);
  const [availableTeams, setAvailableTeams] = useState([]);
  const [homePenalties, setHomePenalties] = useState(0);
  const [awayPenalties, setAwayPenalties] = useState(0);
  const [teamsLoading, setTeamsLoading] = useState(false);
  const [manOfTheMatch, setManOfTheMatch] = useState('');
  const [availablePlayers, setAvailablePlayers] = useState({ home: [], away: [] });

  useEffect(() => {
    const loadMatchData = async () => {
      if (!match) return;

      console.log('Loading match data:', match);
      setLoading(true);
      
      try {
        // First get the full match data with expanded teams
        const fullMatch = await pb.collection('matches').getOne(match.id, {
          expand: 'home_team,away_team,man_of_the_match',
          $cancelKey: `match-get-${match.id}`
        });
        console.log('Full match data:', fullMatch);

        // Get the matchday data with expanded fields
        const matchdayData = await pb.collection('matchdays').getOne(match.matchday, {
          $cancelKey: `matchday-${match.id}`
        });
        console.log('Matchday data:', matchdayData);
        
        const phase = matchdayData.phase;
        console.log('Match phase:', phase);

        // Format date and time
        if (fullMatch.date_time) {
          const matchDate = new Date(fullMatch.date_time);
          setDate(matchDate.toISOString().split('T')[0]);
          setTime(matchDate.toTimeString().slice(0, 5));
        }

        // Load teams for the phase first
        if (phase) {
          await loadTeamsForPhase(phase);
          
          // Now set the match data using the expanded match data
          setHomeTeam(fullMatch.home_team || '');
          setAwayTeam(fullMatch.away_team || '');
          setHomeScore(fullMatch.home_team_score !== null ? String(fullMatch.home_team_score) : '');
          setAwayScore(fullMatch.away_team_score !== null ? String(fullMatch.away_team_score) : '');
          setHomePenalties(fullMatch.home_penalties || 0);
          setAwayPenalties(fullMatch.away_penalties || 0);
          setManOfTheMatch(fullMatch.man_of_the_match || '');

          // Load players for both teams
          if (fullMatch.home_team && fullMatch.away_team) {
            const [homePlayers, awayPlayers] = await Promise.all([
              pb.collection('players').getFullList({
                filter: `team="${fullMatch.home_team}"`,
                sort: 'first_name',
                $cancelKey: `players-home-${match.id}`
              }),
              pb.collection('players').getFullList({
                filter: `team="${fullMatch.away_team}"`,
                sort: 'first_name',
                $cancelKey: `players-away-${match.id}`
              })
            ]);

            setAvailablePlayers({
              home: homePlayers.map(player => ({
                id: player.id,
                name: `${player.first_name} ${player.last_name}`
              })),
              away: awayPlayers.map(player => ({
                id: player.id,
                name: `${player.first_name} ${player.last_name}`
              }))
            });
          }
        } else {
          console.error('No phase found in matchday data');
          setAvailableTeams([]);
        }
      } catch (error) {
        if (!error.message?.includes('autocancelled')) {
          console.error('Error loading match data:', error);
          alert('Error loading match data: ' + (error.message || 'Unknown error'));
        }
      } finally {
        setLoading(false);
      }
    };

    loadMatchData();

    // Cleanup function
    return () => {
      pb.cancelRequest(`match-get-${match?.id}`);
      pb.cancelRequest(`matchday-${match?.id}`);
      pb.cancelRequest(`teams-${match?.id}`);
      pb.cancelRequest(`match-update-${match?.id}`);
      pb.cancelRequest(`players-home-${match?.id}`);
      pb.cancelRequest(`players-away-${match?.id}`);
    };
  }, [match]);

  const loadTeamsForPhase = async (phase) => {
    if (!phase) {
      console.error('Phase is required for loading teams');
      return;
    }

    setTeamsLoading(true);
    try {
      // For semifinals and finals, show all teams
      if (phase === 'gold_semi' || phase === 'silver_semi' || 
          phase === 'gold_final' || phase === 'silver_final') {
        const allTeams = await pb.collection('teams').getFullList({
          sort: 'name',
          $cancelKey: `teams-${match?.id}`
        });
        setAvailableTeams(allTeams.map(team => ({
          id: team.id,
          name: team.name
        })));
        return;
      }

      // For group phases, filter by group
      let collection;
      switch (phase) {
        case 'group_a':
          collection = 'group_a_stats';
          break;
        case 'group_b':
          collection = 'group_b_stats';
          break;
        case 'gold_group':
          collection = 'gold_group_stats';
          break;
        case 'silver_group':
          collection = 'silver_group_stats';
          break;
        default:
          console.error('Invalid phase:', phase);
          return;
      }

      console.log('Fetching teams from collection:', collection);

      const records = await pb.collection(collection).getFullList({
        expand: 'team',
        sort: 'created',
        $cancelKey: `teams-${match?.id}`
      });

      console.log('Records fetched:', records);

      const teams = records
        .map(record => record.expand?.team)
        .filter(Boolean)
        .map(team => ({
          id: team.id,
          name: team.name
        }));

      console.log('Processed teams:', teams);
      setAvailableTeams(teams);
    } catch (error) {
      if (!error.message?.includes('autocancelled')) {
        console.error('Error loading teams for phase:', error);
        setAvailableTeams([]);
      }
    } finally {
      setTeamsLoading(false);
    }
  };

  // Show penalty inputs if the scores are equal
  const showPenalties = Number(homeScore) === Number(awayScore);

  const handleSubmit = async (e, shouldFinish = false) => {
    e.preventDefault();
    
    // Only validate scores if we're finishing the match
    if (shouldFinish && (!homeTeam || !awayTeam || homeScore === '' || awayScore === '')) {
      alert('Please fill in all fields to finish the match');
      return;
    }

    // For just saving, only require teams
    if (!homeTeam || !awayTeam) {
      alert('Please select both teams');
      return;
    }

    // Validate that home and away teams are different
    if (homeTeam === awayTeam) {
      alert('Home and away teams cannot be the same');
      return;
    }

    setLoading(true);
    try {
      // Validate and combine date and time
      if (!date || !time) {
        throw new Error('Date and time are required');
      }
      const datetime = new Date(`${date}T${time}`).toISOString();

      // Prepare the update data
      const data = {
        matchday: match.matchday,
        home_team: homeTeam,
        away_team: awayTeam,
        date_time: datetime,
        is_finished: shouldFinish,
        man_of_the_match: manOfTheMatch || null
      };

      // Only include scores if they are provided
      if (homeScore !== '') {
        data.home_team_score = parseInt(homeScore);
      }
      if (awayScore !== '') {
        data.away_team_score = parseInt(awayScore);
      }

      // Add penalties only if the match is finished and scores are equal
      if (shouldFinish && showPenalties) {
        data.home_penalties = parseInt(homePenalties) || 0;
        data.away_penalties = parseInt(awayPenalties) || 0;
      }

      console.log('Updating match with data:', data);

      // Update the match with cancelKey
      const updatedMatch = await pb.collection('matches').update(match.id, data, {
        $cancelKey: `match-update-${match.id}`
      });
      console.log('Match updated:', updatedMatch);
      
      // If we're finishing the match or updating MOTM, update statistics
      if (shouldFinish || data.man_of_the_match !== undefined) {
        // Get the matchday data to know which phase we're in
        const matchdayData = await pb.collection('matchdays').getOne(match.matchday, {
          $cancelKey: `matchday-update-${match.id}`
        });
        
        // Update group stats if finishing the match
        if (shouldFinish) {
          await updateGroupStats({
            ...updatedMatch,
            phase: matchdayData.phase,
            home_team_score: parseInt(homeScore),
            away_team_score: parseInt(awayScore)
          });
        }

        // Update player statistics
        await updatePlayerStatistics();
      }

      onSave(updatedMatch);
    } catch (error) {
      if (!error.message?.includes('autocancelled')) {
        console.error('Error updating match:', error);
        alert('Error updating match: ' + (error.message || 'Unknown error'));
      }
    } finally {
      setLoading(false);
    }
  };

  if (teamsLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner size="md" color="green" />
      </div>
    );
  }

  if (!match) {
    console.error('Match object is undefined');
    onCancel?.();
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
        <h2 className="text-2xl font-bold mb-4">Edit Match Result</h2>
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <LoadingSpinner size="md" color="green" />
          </div>
        ) : (
          <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-4">
            <div>
              <label className="block text-gray-700 font-semibold mb-1">Home Team</label>
              <select
                value={homeTeam}
                onChange={(e) => setHomeTeam(e.target.value)}
                className="w-full p-2 border rounded"
                required
              >
                <option value="">Select Home Team</option>
                {availableTeams.map(team => (
                  <option key={team.id} value={team.id}>{team.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-1">Away Team</label>
              <select
                value={awayTeam}
                onChange={(e) => setAwayTeam(e.target.value)}
                className="w-full p-2 border rounded"
                required
              >
                <option value="">Select Away Team</option>
                {availableTeams.map(team => (
                  <option key={team.id} value={team.id}>{team.name}</option>
                ))}
              </select>
            </div>

            <div className="flex space-x-4">
              <div className="w-1/2">
                <label className="block text-gray-700 font-semibold mb-1">Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
              <div className="w-1/2">
                <label className="block text-gray-700 font-semibold mb-1">Time</label>
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
            </div>

            <div className="flex space-x-4">
              <div className="w-1/2">
                <label className="block text-gray-700 font-semibold mb-1">Home Score</label>
                <input
                  type="number"
                  min="0"
                  value={homeScore}
                  onChange={(e) => setHomeScore(e.target.value)}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
              <div className="w-1/2">
                <label className="block text-gray-700 font-semibold mb-1">Away Score</label>
                <input
                  type="number"
                  min="0"
                  value={awayScore}
                  onChange={(e) => setAwayScore(e.target.value)}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
            </div>

            {showPenalties && (
              <div className="flex space-x-4">
                <div className="w-1/2">
                  <label className="block text-gray-700 font-semibold mb-1">Home Penalties</label>
                  <input
                    type="number"
                    min="0"
                    value={homePenalties}
                    onChange={(e) => setHomePenalties(e.target.value)}
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div className="w-1/2">
                  <label className="block text-gray-700 font-semibold mb-1">Away Penalties</label>
                  <input
                    type="number"
                    min="0"
                    value={awayPenalties}
                    onChange={(e) => setAwayPenalties(e.target.value)}
                    className="w-full p-2 border rounded"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Jugador del Partido
              </label>
              <select
                value={manOfTheMatch}
                onChange={(e) => setManOfTheMatch(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-accent focus:ring-accent sm:text-sm"
              >
                <option value="">Seleccionar jugador</option>
                {availablePlayers.home.length > 0 && (
                  <optgroup label="Equipo Local">
                    {availablePlayers.home.map(player => (
                      <option key={player.id} value={player.id}>
                        {player.name}
                      </option>
                    ))}
                  </optgroup>
                )}
                {availablePlayers.away.length > 0 && (
                  <optgroup label="Equipo Visitante">
                    {availablePlayers.away.map(player => (
                      <option key={player.id} value={player.id}>
                        {player.name}
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
            </div>

            <div className="flex justify-end space-x-4 mt-6">
              <button
                type="button"
                onClick={onCancel}
                className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
              >
                Save Details
              </button>
              <button 
                type="button"
                onClick={(e) => handleSubmit(e, true)}
                className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded"
              >
                End Match
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default AdminMatchResultModal;
