import { pb } from '../config';

export const updateGroupStats = async (match) => {
  if (!match.is_finished) return;

  const homeTeam = match.home_team;
  const awayTeam = match.away_team;
  const homeScore = match.home_team_score;
  const awayScore = match.away_team_score;

  // Find which groups the teams belong to
  const groups = ['group_a_stats', 'group_b_stats', 'gold_group_stats', 'silver_group_stats'];
  
  for (const group of groups) {
    try {
      // Get all records for the current group
      const records = await pb.collection(group).getFullList({
        filter: `team = "${homeTeam}" || team = "${awayTeam}"`
      });

      // Update stats for both teams if they're in this group
      for (const record of records) {
        const isHomeTeam = record.team === homeTeam;
        const teamScore = isHomeTeam ? homeScore : awayScore;
        const opponentScore = isHomeTeam ? awayScore : homeScore;

        let updateData = {
          scored_goals: record.scored_goals + teamScore,
          conceived_goals: record.conceived_goals + opponentScore
        };

        if (teamScore > opponentScore) {
          updateData.won_matches = record.won_matches + 1;
        } else if (teamScore < opponentScore) {
          updateData.lost_matches = record.lost_matches + 1;
        } else {
          updateData.drawn_matches = record.drawn_matches + 1;
        }

        await pb.collection(group).update(record.id, updateData);
      }
    } catch (error) {
      console.error(`Error updating ${group} stats:`, error);
    }
  }
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
      if (b.points !== a.points) return b.points - a.points;
      if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
      if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
      return a.goalsAgainst - b.goalsAgainst;
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