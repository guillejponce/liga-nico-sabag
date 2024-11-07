import { pb } from '../config';

export const updateTeamStatistics = async () => {
  try {
    console.log('Starting complete team statistics update');
    
    // 1. First get all teams and reset their statistics
    const teams = await pb.collection('teams').getFullList();
    console.log('Fetched all teams:', teams);

    // Reset all team statistics
    const resetPromises = teams.map(async (team) => {
      const resetStats = {
        won_matches: 0,
        lost_matches: 0,
        drawn_matches: 0,
        scored_goals: 0,
        concieved_goals: 0
      };
      console.log(`Resetting stats for team ${team.id}:`, resetStats);
      return await pb.collection('teams').update(team.id, resetStats);
    });

    await Promise.all(resetPromises);
    console.log('All team statistics reset to zero');

    // 2. Fetch ALL finished matches from ALL matchdays
    const matches = await pb.collection('matches').getList(1, 500, {
      filter: 'is_finished=true',
      expand: 'home_team,away_team'
    });

    console.log('Fetched all finished matches:', matches.items);

    if (!matches.items.length) {
      console.log('No finished matches found');
      return false;
    }

    // 3. Process each match and collect team statistics updates
    const teamUpdates = {};

    for (const match of matches.items) {
      console.log('Processing match:', match);

      const homeTeamId = match.home_team;
      const awayTeamId = match.away_team;
      const homeScore = parseInt(match.home_team_score) || 0;
      const awayScore = parseInt(match.away_team_score) || 0;

      console.log(`Match details - Home: ${homeTeamId}(${homeScore}) vs Away: ${awayTeamId}(${awayScore})`);

      // Initialize team updates if not exists
      if (!teamUpdates[homeTeamId]) {
        teamUpdates[homeTeamId] = {
          won_matches: 0,
          lost_matches: 0,
          drawn_matches: 0,
          scored_goals: 0,
          concieved_goals: 0
        };
      }
      if (!teamUpdates[awayTeamId]) {
        teamUpdates[awayTeamId] = {
          won_matches: 0,
          lost_matches: 0,
          drawn_matches: 0,
          scored_goals: 0,
          concieved_goals: 0
        };
      }

      // Update statistics based on match result
      if (homeScore > awayScore) {
        teamUpdates[homeTeamId].won_matches += 1;
        teamUpdates[awayTeamId].lost_matches += 1;
        console.log('Home team won');
      } else if (homeScore < awayScore) {
        teamUpdates[homeTeamId].lost_matches += 1;
        teamUpdates[awayTeamId].won_matches += 1;
        console.log('Away team won');
      } else {
        teamUpdates[homeTeamId].drawn_matches += 1;
        teamUpdates[awayTeamId].drawn_matches += 1;
        console.log('Match drawn');
      }

      // Update goals
      teamUpdates[homeTeamId].scored_goals += homeScore;
      teamUpdates[homeTeamId].concieved_goals += awayScore;
      teamUpdates[awayTeamId].scored_goals += awayScore;
      teamUpdates[awayTeamId].concieved_goals += homeScore;

      console.log('Updated stats:', {
        homeTeam: teamUpdates[homeTeamId],
        awayTeam: teamUpdates[awayTeamId]
      });
    }

    // 4. Update all teams in the database with their final statistics
    console.log('Final team updates before saving:', teamUpdates);

    const updatePromises = Object.entries(teamUpdates).map(async ([teamId, stats]) => {
      console.log(`Updating team ${teamId} with final stats:`, stats);
      try {
        const result = await pb.collection('teams').update(teamId, stats);
        console.log(`Team ${teamId} update result:`, result);
        return result;
      } catch (err) {
        console.error(`Error updating team ${teamId}:`, err);
        throw err;
      }
    });

    const results = await Promise.all(updatePromises);
    console.log('All team updates completed:', results);

    return true;
  } catch (error) {
    console.error('Error updating team statistics:', error);
    throw new Error(`Failed to update team statistics: ${error.message}`);
  }
};

export const calculateTeamStats = (team) => {
  // Points calculation: 3 for win, 1 for draw, 0 for loss
  const points = (team.won_matches * 3) + (team.drawn_matches * 1);
  
  // Goal difference calculation
  const goalDifference = team.scored_goals - team.concieved_goals;
  
  // Games played calculation
  const gamesPlayed = team.won_matches + team.drawn_matches + team.lost_matches;

  return {
    points,
    goalDifference,
    gamesPlayed,
    goalsForAgainst: `${team.scored_goals}:${team.concieved_goals}`
  };
};
