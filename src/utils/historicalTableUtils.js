import { pb } from '../config';

export const calculateHistoricalStats = async (signal) => {
  try {
    // 1. Get all teams
    const teams = await pb.collection('teams').getFullList({
      signal
    });
    
    // Initialize historical stats for each team
    const historicalStats = teams.reduce((acc, team) => {
      acc[team.id] = {
        team: team,
        points: 0,
        won_matches: 0,
        drawn_matches: 0,
        lost_matches: 0,
        scored_goals: 0,
        conceived_goals: 0,
        goal_difference: 0,
        matches_played: 0,
        performance: 0
      };
      return acc;
    }, {});

    // 2. Get all matches from all seasons that are finished
    const matches = await pb.collection('matches').getFullList({
      filter: 'is_finished=true',
      expand: 'home_team,away_team',
      signal
    });

    // 3. Process each match to calculate historical stats
    matches.forEach(match => {
      const homeTeamId = match.home_team;
      const awayTeamId = match.away_team;
      const homeScore = parseInt(match.home_team_score) || 0;
      const awayScore = parseInt(match.away_team_score) || 0;

      // Update home team stats
      if (historicalStats[homeTeamId]) {
        historicalStats[homeTeamId].matches_played += 1;
        historicalStats[homeTeamId].scored_goals += homeScore;
        historicalStats[homeTeamId].conceived_goals += awayScore;
        
        if (homeScore > awayScore) {
          historicalStats[homeTeamId].won_matches += 1;
          historicalStats[homeTeamId].points += 3;
        } else if (homeScore === awayScore) {
          historicalStats[homeTeamId].drawn_matches += 1;
          historicalStats[homeTeamId].points += 1;
        } else {
          historicalStats[homeTeamId].lost_matches += 1;
        }
      }

      // Update away team stats
      if (historicalStats[awayTeamId]) {
        historicalStats[awayTeamId].matches_played += 1;
        historicalStats[awayTeamId].scored_goals += awayScore;
        historicalStats[awayTeamId].conceived_goals += homeScore;
        
        if (awayScore > homeScore) {
          historicalStats[awayTeamId].won_matches += 1;
          historicalStats[awayTeamId].points += 3;
        } else if (awayScore === homeScore) {
          historicalStats[awayTeamId].drawn_matches += 1;
          historicalStats[awayTeamId].points += 1;
        } else {
          historicalStats[awayTeamId].lost_matches += 1;
        }
      }
    });

    // 4. Calculate goal difference, performance percentage and convert to array
    const historicalTable = Object.values(historicalStats).map(stats => {
      const totalPossiblePoints = stats.matches_played * 3;
      const performancePercentage = totalPossiblePoints > 0 
        ? ((stats.points / totalPossiblePoints) * 100).toFixed(1)
        : 0;

      return {
        ...stats,
        goal_difference: stats.scored_goals - stats.conceived_goals,
        performance: performancePercentage
      };
    });

    // 5. Sort by points (desc), goal difference (desc), goals scored (desc)
    return historicalTable.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.goal_difference !== a.goal_difference) return b.goal_difference - a.goal_difference;
      return b.scored_goals - a.scored_goals;
    });
  } catch (error) {
    console.error('Error calculating historical stats:', error);
    throw error;
  }
};
