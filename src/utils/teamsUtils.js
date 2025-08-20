import { pb } from '../config';

// Returns an array of phase identifiers based on a given stage
export const getPhasesByStage = (stage) => {
  const stagePhases = {
    'group_phase': ['group_a', 'group_b', 'regular'],
    'playoffs': ['gold_group', 'silver_group', 'bronze_group'],
    'semifinals': ['gold_semi', 'silver_semi', 'bronze_semi'],
    'finals': ['gold_final', 'silver_final', 'bronze_final']
  };
  return stagePhases[stage] || [];
};

// Updates team statistics by first resetting them then processing finished matches
export const updateTeamStatistics = async (selectedStage) => {
  try {
    console.log('Starting team statistics update for stage:', selectedStage);
    const phases = getPhasesByStage(selectedStage);
    
    // Get current edition
    const currentEdition = await pb.collection('editions').getFirstListItem('is_current = true');
    if (!currentEdition) {
      throw new Error('No current edition found');
    }
    console.log('Current edition:', currentEdition);

    // 1. Fetch all teams and reset their statistics
    const teams = await pb.collection('teams').getFullList();
    await Promise.all(
      teams.map(team => {
        const resetStats = {
          won_matches: 0,
          lost_matches: 0,
          drawn_matches: 0,
          scored_goals: 0,
          conceived_goals: 0,
        };
        return pb.collection('teams').update(team.id, resetStats);
      })
    );

    // 2. Build a filter string with proper spacing and current season
    const phaseFilters = phases.map(phase => `matchday.phase="${phase}"`).join(' || ');
    const filterString = `is_finished=true && matchday.season="${currentEdition.id}" && (${phaseFilters})`;
    console.log('Using filter:', filterString);

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
      // Ensure scores default to 0 if missing
      const homeScore = parseInt(match.home_team_score) || 0;
      const awayScore = parseInt(match.away_team_score) || 0;

      if (!teamUpdates[homeTeamId]) {
        teamUpdates[homeTeamId] = { won_matches: 0, lost_matches: 0, drawn_matches: 0, scored_goals: 0, conceived_goals: 0 };
      }
      if (!teamUpdates[awayTeamId]) {
        teamUpdates[awayTeamId] = { won_matches: 0, lost_matches: 0, drawn_matches: 0, scored_goals: 0, conceived_goals: 0 };
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
      teamUpdates[homeTeamId].conceived_goals += awayScore;
      teamUpdates[awayTeamId].scored_goals += awayScore;
      teamUpdates[awayTeamId].conceived_goals += homeScore;
    });

    // 4. Update teams with the new statistics
    await Promise.all(
      Object.entries(teamUpdates).map(([teamId, stats]) => {
        console.log(`Updating team ${teamId} with stats:`, stats);
        return pb.collection('teams').update(teamId, stats);
      })
    );

    console.log('Team statistics update completed for stage:', selectedStage);
    return true;
  } catch (error) {
    console.error('Error updating team statistics:', error);
    throw new Error(`Failed to update team statistics: ${error.message}`);
  }
};

// Calculates team statistics ensuring numeric defaults
export const calculateTeamStats = (team) => {
  const won = team.won_matches || 0;
  const drawn = team.drawn_matches || 0;
  const lost = team.lost_matches || 0;
  const scored = team.scored_goals || 0;
  const conceived = team.conceived_goals || 0;
  const points = (won * 3) + drawn;
  const goalDifference = scored - conceived;
  const gamesPlayed = won + drawn + lost;
  return {
    points,
    goalDifference,
    gamesPlayed,
    goalsForAgainst: `${scored}:${conceived}`,
    won,
    drawn,
    lost,
  };
};

// Returns an array of team IDs that have participated in matches for a given phase
export const getTeamsByPhase = async (phase) => {
  try {
    // Get current edition
    const currentEdition = await pb.collection('editions').getFirstListItem('is_current = true');
    if (!currentEdition) {
      console.log('No current edition found');
      return [];
    }

    const matches = await pb.collection('matches').getList(1, 500, {
      filter: `matchday.phase="${phase}" && matchday.season="${currentEdition.id}"`,
      expand: 'home_team,away_team'
    });
    const teamIds = new Set();
    matches.items.forEach(match => {
      if (match.home_team) teamIds.add(match.home_team);
      if (match.away_team) teamIds.add(match.away_team);
    });
    return Array.from(teamIds);
  } catch (error) {
    console.log(`No matches found for phase: ${phase}`);
    return []; // Return empty array instead of throwing error
  }
};

// Returns an array of team IDs that participated across all phases in a stage
export const getParticipatingTeams = async (stage) => {
  try {
    const phases = getPhasesByStage(stage);
    const teamsPromises = phases.map(phase => getTeamsByPhase(phase));
    const teamsArrays = await Promise.all(teamsPromises);
    const teamIds = new Set(teamsArrays.flat());
    return Array.from(teamIds);
  } catch (error) {
    console.log(`No teams found for stage: ${stage}`);
    return [];
  }
};
