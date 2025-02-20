import { pb } from '../config';

export const getPhasesByStage = (stage) => {
  const stagePhases = {
    'group_phase': ['group_a', 'group_b'],
    'playoffs': ['gold_group', 'silver_group', 'bronze_group'],
    'gold_finals': ['gold_semi', 'gold_final'],
    'silver_finals': ['silver_semi', 'silver_final'],
    'bronze_finals': ['bronze_semi', 'bronze_final']
  };
  return stagePhases[stage] || [];
};

export const updateTeamStatistics = async (selectedStage) => {
  try {
    console.log('Starting team statistics update for stage:', selectedStage);
    const phases = getPhasesByStage(selectedStage);
    
    // 1. Fetch all teams and reset their statistics
    const teams = await pb.collection('teams').getFullList();
    await Promise.all(teams.map(team => {
      const resetStats = {
        won_matches: 0,
        lost_matches: 0,
        drawn_matches: 0,
        scored_goals: 0,
        concieved_goals: 0,
      };
      return pb.collection('teams').update(team.id, resetStats);
    }));

    // 2. Fetch finished matches for all phases in the stage
    const phaseFilters = phases.map(phase => `matchday.phase="${phase}"`).join('||');
    const filterString = `is_finished=true && (${phaseFilters})`;
    const matchesResponse = await pb.collection('matches').getList(1, 500, {
      filter: filterString,
      expand: 'home_team,away_team,matchday'
    });
    const matches = matchesResponse.items;

    if (!matches.length) {
      console.log('No finished matches found for stage:', selectedStage);
      return false;
    }

    // 3. Process each match to update team statistics
    const teamUpdates = {};
    matches.forEach(match => {
      const homeTeamId = match.home_team;
      const awayTeamId = match.away_team;
      const homeScore = parseInt(match.home_team_score) || 0;
      const awayScore = parseInt(match.away_team_score) || 0;

      if (!teamUpdates[homeTeamId]) {
        teamUpdates[homeTeamId] = { won_matches: 0, lost_matches: 0, drawn_matches: 0, scored_goals: 0, concieved_goals: 0 };
      }
      if (!teamUpdates[awayTeamId]) {
        teamUpdates[awayTeamId] = { won_matches: 0, lost_matches: 0, drawn_matches: 0, scored_goals: 0, concieved_goals: 0 };
      }

      if (homeScore > awayScore) {
        teamUpdates[homeTeamId].won_matches += 1;
        teamUpdates[awayTeamId].lost_matches += 1;
      } else if (homeScore < awayScore) {
        teamUpdates[homeTeamId].lost_matches += 1;
        teamUpdates[awayTeamId].won_matches += 1;
      } else {
        teamUpdates[homeTeamId].drawn_matches += 1;
        teamUpdates[awayTeamId].drawn_matches += 1;
      }

      teamUpdates[homeTeamId].scored_goals += homeScore;
      teamUpdates[homeTeamId].concieved_goals += awayScore;
      teamUpdates[awayTeamId].scored_goals += awayScore;
      teamUpdates[awayTeamId].concieved_goals += homeScore;
    });

    // 4. Update teams with the new statistics
    await Promise.all(Object.entries(teamUpdates).map(([teamId, stats]) => {
      console.log(`Updating team ${teamId} with stats:`, stats);
      return pb.collection('teams').update(teamId, stats);
    }));

    console.log('Team statistics update completed for stage:', selectedStage);
    return true;
  } catch (error) {
    console.error('Error updating team statistics:', error);
    throw new Error(`Failed to update team statistics: ${error.message}`);
  }
};

export const calculateTeamStats = (team) => {
  // Calculate points: 3 per win, 1 per draw
  const points = (team.won_matches * 3) + (team.drawn_matches * 1);
  const goalDifference = team.scored_goals - team.concieved_goals;
  const gamesPlayed = team.won_matches + team.drawn_matches + team.lost_matches;
  return {
    points,
    goalDifference,
    gamesPlayed,
    goalsForAgainst: `${team.scored_goals}:${team.concieved_goals}`,
    won: team.won_matches,
    drawn: team.drawn_matches,
    lost: team.lost_matches,
  };
};

export const getTeamsByPhase = async (phase) => {
  const matches = await pb.collection('matches').getList(1, 500, {
    filter: `matchday.phase="${phase}"`,
    expand: 'home_team,away_team'
  });

  const teamIds = new Set();
  matches.items.forEach(match => {
    if (match.home_team) teamIds.add(match.home_team);
    if (match.away_team) teamIds.add(match.away_team);
  });

  return Array.from(teamIds);
};

export const getParticipatingTeams = async (stage) => {
  const phases = getPhasesByStage(stage);
  const teamsPromises = phases.map(phase => getTeamsByPhase(phase));
  const teamsArrays = await Promise.all(teamsPromises);
  
  // Combine all team IDs from all phases
  const teamIds = new Set(teamsArrays.flat());
  return Array.from(teamIds);
};
