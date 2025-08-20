import { pb } from '../config';

// Recalculate statistics in the `table` collection for the current (active) edition.
// It resets all records, then processes every finished match of the edition
// and updates wins/draws/losses/goals so the league table stays in sync.
export const updateTableStatistics = async () => {
  try {
    console.log('Starting updateTableStatistics');

    // 1. Get current edition
    const currentEdition = await pb.collection('editions').getFirstListItem('is_current = true');
    if (!currentEdition) {
      console.warn('No current edition found, aborting updateTableStatistics');
      return false;
    }
    if (currentEdition.format !== 'league') {
      // Only applicable for league-format editions
      console.log('Current edition is not league format; skipping table update');
      return false;
    }

    // 2. Get all existing table records (one per team)
    const tableRecords = await pb.collection('table').getFullList({ perPage: 500 });

    // 3. Fetch all matchdays of the edition to build a list of IDs
    const matchdays = await pb.collection('matchdays').getFullList({
      filter: `season = "${currentEdition.id}"`,
      sort: '+number',
      perPage: 500,
    });
    const matchdayIds = matchdays.map(md => md.id);

    // 4. Fetch all finished matches for those matchdays
    const matches = await pb.collection('matches').getFullList({
      filter: `(${matchdayIds.map(id => `matchday = "${id}"`).join(' || ')}) && is_finished = true`,
      perPage: 500,
    });

    // Only reset stats if we have matches to process
    if (matches.length > 0) {
      await Promise.all(
        tableRecords.map(rec =>
          pb.collection('table').update(rec.id, {
            won_matches: 0,
            lost_matches: 0,
            drawn_matches: 0,
            scored_goals: 0,
            conceived_goals: 0,
            matches_played: 0,
            points: 0,
          })
        )
      );
    } else {
      console.log('No finished matches found, skipping table reset');
      return false;
    }

    // 5. Process matches and update stats
    const statsMap = {};

    const ensureTeamInMap = id => {
      if (!statsMap[id]) {
        statsMap[id] = {
          won_matches: 0,
          lost_matches: 0,
          drawn_matches: 0,
          scored_goals: 0,
          conceived_goals: 0,
          matches_played: 0,
          points: 0,
        };
      }
    };

    matches.forEach(match => {
      const home = match.home_team;
      const away = match.away_team;
      const hs = parseInt(match.home_team_score) || 0;
      const as = parseInt(match.away_team_score) || 0;

      ensureTeamInMap(home);
      ensureTeamInMap(away);

      // increase matches played
      statsMap[home].matches_played = (statsMap[home].matches_played || 0) + 1;
      statsMap[away].matches_played = (statsMap[away].matches_played || 0) + 1;

      // goals
      statsMap[home].scored_goals += hs;
      statsMap[home].conceived_goals += as;
      statsMap[away].scored_goals += as;
      statsMap[away].conceived_goals += hs;

      if (hs > as) {
        statsMap[home].won_matches += 1;
        statsMap[away].lost_matches += 1;
      } else if (hs < as) {
        statsMap[away].won_matches += 1;
        statsMap[home].lost_matches += 1;
      } else {
        statsMap[home].drawn_matches += 1;
        statsMap[away].drawn_matches += 1;
      }
    });

    // calculate points for each team
    for (const stats of Object.values(statsMap)) {
      stats.points = stats.won_matches * 3 + stats.drawn_matches;
    }

    // 6. Persist stats back into table collection (create records if missing)
    const recordByTeam = Object.fromEntries(tableRecords.map(r => [r.team, r]));

    for (const [teamId, stats] of Object.entries(statsMap)) {
      if (recordByTeam[teamId]) {
        // update existing record
        await pb.collection('table').update(recordByTeam[teamId].id, stats);
      } else {
        // create new record
        await pb.collection('table').create({ team: teamId, ...stats });
      }
    }

    console.log('updateTableStatistics completed');
    return true;
  } catch (error) {
    console.error('Error in updateTableStatistics:', error);
    return false;
  }
};