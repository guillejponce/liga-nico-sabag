import { pb } from '../config';

export const updateGroupStats = async () => {
  console.log('Starting updateGroupStats...');

  // Find which groups the teams belong to based on the match phase
  const groups = ['group_a_stats', 'group_b_stats', 'gold_group_stats', 'silver_group_stats'];
  
  // Get current edition
  const currentEdition = await pb.collection('editions').getFirstListItem('is_current = true');
  if (!currentEdition) {
    throw new Error('No current edition found');
  }
  console.log('Current edition:', currentEdition);

  // Process each group
  for (const group of groups) {
    try {
      console.log(`\n=== Processing group: ${group} ===`);
      
      // Get the phase name from the group collection name
      const phase = group.replace('_stats', '');
      console.log('Processing phase:', phase);

      // 1. First get all records for this group
      const records = await pb.collection(group).getFullList({
        expand: 'team'
      });
      console.log(`Found ${records.length} teams in ${group}:`, records.map(r => ({
        name: r.expand.team.name,
        recordId: r.id,
        teamId: r.team
      })));

      // Reset all stats to 0 first
      console.log('Resetting all stats to 0...');
      for (const record of records) {
        try {
          await pb.collection(group).update(record.id, {
            won_matches: 0,
            lost_matches: 0,
            drawn_matches: 0,
            scored_goals: 0,
            conceived_goals: 0
          });
        } catch (error) {
          console.error(`Error resetting stats for record ${record.id}:`, error);
          throw error;
        }
      }

      // 2. Get all finished matches for the current edition and specific phase
      const matchdays = await pb.collection('matchdays').getFullList({
        filter: `season = "${currentEdition.id}" && phase = "${phase}"`
      });
      console.log(`Found ${matchdays.length} matchdays for phase ${phase}`);

      const matchdayIds = matchdays.map(md => md.id);
      
      if (matchdayIds.length === 0) {
        console.log('No matchdays found for this phase, skipping...');
        continue;
      }

      const matches = await pb.collection('matches').getFullList({
        filter: `(${matchdayIds.map(id => `matchday = "${id}"`).join(' || ')}) && is_finished = true`,
        expand: 'home_team,away_team'
      });
      console.log(`Found ${matches.length} finished matches for this phase`);

      // Create a map of team IDs to their stats records
      const teamRecordMap = {};
      for (const record of records) {
        teamRecordMap[record.team] = {
          recordId: record.id,
          stats: {
            won_matches: 0,
            lost_matches: 0,
            drawn_matches: 0,
            scored_goals: 0,
            conceived_goals: 0
          }
        };
      }

      // Process each match to calculate stats
      console.log('\nProcessing matches for stats...');
      for (const match of matches) {
        const homeTeamId = match.home_team;
        const awayTeamId = match.away_team;
        const homeScore = match.home_team_score;
        const awayScore = match.away_team_score;

        console.log(`Processing match: ${match.expand?.home_team?.name} vs ${match.expand?.away_team?.name} (${homeScore}-${awayScore})`);

        // Update home team stats if it's in this group
        if (teamRecordMap[homeTeamId]) {
          teamRecordMap[homeTeamId].stats.scored_goals += homeScore;
          teamRecordMap[homeTeamId].stats.conceived_goals += awayScore;
          if (homeScore > awayScore) {
            teamRecordMap[homeTeamId].stats.won_matches += 1;
          } else if (homeScore < awayScore) {
            teamRecordMap[homeTeamId].stats.lost_matches += 1;
          } else {
            teamRecordMap[homeTeamId].stats.drawn_matches += 1;
          }
        }

        // Update away team stats if it's in this group
        if (teamRecordMap[awayTeamId]) {
          teamRecordMap[awayTeamId].stats.scored_goals += awayScore;
          teamRecordMap[awayTeamId].stats.conceived_goals += homeScore;
          if (awayScore > homeScore) {
            teamRecordMap[awayTeamId].stats.won_matches += 1;
          } else if (awayScore < homeScore) {
            teamRecordMap[awayTeamId].stats.lost_matches += 1;
          } else {
            teamRecordMap[awayTeamId].stats.drawn_matches += 1;
          }
        }
      }

      // Update all teams in the group with their final stats
      console.log('\nUpdating final stats in database:');
      for (const [teamId, data] of Object.entries(teamRecordMap)) {
        try {
          console.log(`Updating stats for team ${teamId} in ${group}:`, data.stats);
          await pb.collection(group).update(data.recordId, data.stats);
          
          // Verify the update
          const verifyUpdate = await pb.collection(group).getOne(data.recordId);
          console.log(`Verified stats for team ${teamId}:`, {
            won_matches: verifyUpdate.won_matches,
            lost_matches: verifyUpdate.lost_matches,
            drawn_matches: verifyUpdate.drawn_matches,
            scored_goals: verifyUpdate.scored_goals,
            conceived_goals: verifyUpdate.conceived_goals
          });
        } catch (error) {
          console.error(`Error updating stats for team ${teamId} in ${group}:`, error);
          throw error;
        }
      }

      console.log(`Finished processing group: ${group}\n`);
    } catch (error) {
      console.error(`Error updating ${group} stats:`, error);
      throw error;
    }
  }
  console.log('UpdateGroupStats completed');
  return true;
};

export const getGroupStats = async (groupName, signal) => {
  try {
    // Crear una nueva instancia de PocketBase para esta petición específica
    const records = await pb.collection(groupName).getList(1, 50, {
      expand: 'team',
      $cancelKey: groupName, // Usar un cancelKey único para cada petición
      requestKey: groupName, // Identificador único para la petición
    });

    // Transformar los registros para incluir la información del equipo y calcular estadísticas
    return records.items.map(record => {
      const team = record.expand?.team;
      if (!team) return null;

      return {
        team: {
          id: team.id,
          name: team.name,
          logo: team.logo ? pb.getFileUrl(team, team.logo) : null
        },
        matchesPlayed: record.won_matches + record.lost_matches + record.drawn_matches,
        wins: record.won_matches,
        draws: record.drawn_matches,
        losses: record.lost_matches,
        goalsFor: record.scored_goals,
        goalsAgainst: record.conceived_goals,
        goalDifference: record.scored_goals - record.conceived_goals,
        points: (record.won_matches * 3) + record.drawn_matches
      };
    }).filter(Boolean).sort((a, b) => {
      // 1. Primero por puntos
      if (b.points !== a.points) return b.points - a.points;
      
      // 2. Si los puntos son iguales, por diferencia de gol
      if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
      
      // 3. Si la diferencia de gol es igual, por goles a favor
      if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
      
      // 4. Si los goles a favor son iguales, por goles en contra (menos es mejor)
      if (b.goalsAgainst !== a.goalsAgainst) return a.goalsAgainst - b.goalsAgainst;
      
      // 5. Si todo es igual, ordenar alfabéticamente por nombre de equipo
      return a.team.name.localeCompare(b.team.name);
    });
  } catch (error) {
    // Solo registrar errores que no sean de cancelación
    if (!error.isAbort && !error.message?.includes('cancelled')) {
      console.error(`Error getting ${groupName} stats:`, error);
    }
    throw error;
  }
};

export const resetGroupStats = async () => {
  const groups = ['group_a_stats', 'group_b_stats', 'gold_group_stats', 'silver_group_stats'];
  
  for (const group of groups) {
    try {
      const records = await pb.collection(group).getFullList();
      
      for (const record of records) {
        await pb.collection(group).update(record.id, {
          won_matches: 0,
          lost_matches: 0,
          drawn_matches: 0,
          scored_goals: 0,
          conceived_goals: 0
        });
      }
    } catch (error) {
      console.error(`Error resetting ${group} stats:`, error);
    }
  }
};

export const getTeamsByPhase = async (phase) => {
  let collection;
  
  // Map phase to corresponding collection
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
      return [];
  }

  try {
    const records = await pb.collection(collection).getFullList({
      expand: 'team'
    });
    return records.map(record => record.expand.team);
  } catch (error) {
    console.error(`Error getting teams for phase ${phase}:`, error);
    return [];
  }
}; 