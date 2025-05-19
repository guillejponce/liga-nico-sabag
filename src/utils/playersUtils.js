import { pb } from '../config';
import { fetchCurrentEdition } from '../hooks/admin/editionHandlers';

export const updatePlayerStatistics = async (matchId) => {
  try {
    // If specific match ID provided, update only related players
    if (matchId) {
      return updatePlayerStatsForMatch(matchId);
    }
    
    console.log('Starting complete player statistics update');
    
    // 0. Get current edition
    const currentEdition = await fetchCurrentEdition();
    if (!currentEdition) {
      throw new Error('No current edition found. Please set a current edition before updating statistics.');
    }
    console.log('Updating statistics for edition:', currentEdition);

    // 1. First get all players and reset their statistics
    const players = await pb.collection('players').getFullList();
    if (!players || players.length === 0) {
      console.warn('No players found in the database');
      return false;
    }
    console.log('Fetched all players:', players.length);

    // Reset all player statistics
    const resetPromises = players.map(async (player) => {
      const resetStats = {
        scored_goals: 0,
        yellow_cards: 0,
        red_cards: 0,
        man_of_the_match: 0
      };
      return await pb.collection('players').update(player.id, resetStats);
    });

    await Promise.all(resetPromises);
    console.log('All player statistics reset to zero');

    // 2. Get all matchdays for current edition
    const matchdays = await pb.collection('matchdays').getFullList({
      filter: `season = "${currentEdition.id}"`,
    });
    if (!matchdays || matchdays.length === 0) {
      console.warn('No matchdays found for current edition');
      return false;
    }
    console.log('Fetched matchdays for current edition:', matchdays.length);

    // 3. Get all matches for these matchdays
    const matches = [];
    for (const matchday of matchdays) {
      const matchdayMatches = await pb.collection('matches').getFullList({
        filter: `matchday = "${matchday.id}" && is_finished = true`,
      });
      matches.push(...matchdayMatches);
    }
    if (matches.length === 0) {
      console.warn('No matches found for current edition');
      return false;
    }
    console.log('Found matches for current edition:', matches.length);

    // Initialize player updates
    const playerUpdates = {};

    // Process MOTM from matches
    for (const match of matches) {
      if (match.man_of_the_match) {
        if (!playerUpdates[match.man_of_the_match]) {
          playerUpdates[match.man_of_the_match] = {
            scored_goals: 0,
            yellow_cards: 0,
            red_cards: 0,
            man_of_the_match: 0
          };
        }
        playerUpdates[match.man_of_the_match].man_of_the_match += 1;
      }
    }

    // 4. Process events for goals and cards
    const matchIds = matches.map(m => m.id);
    const filterConditions = matchIds.map(id => `match = "${id}"`).join(' || ');
    console.log('Generated filter:', filterConditions);
    
    const events = await pb.collection('events').getFullList({
      filter: filterConditions,
      expand: 'player,match'
    });
    console.log('Fetched events for current edition:', events?.length || 0);

    // Process each event
    for (const event of events) {
      if (!event.player) {
        console.warn('Event has no player:', event);
        continue;
      }
      
      const playerId = event.player;

      // Initialize player updates if not exists
      if (!playerUpdates[playerId]) {
        playerUpdates[playerId] = {
          scored_goals: 0,
          yellow_cards: 0,
          red_cards: 0,
          man_of_the_match: 0
        };
      }

      // Update statistics based on event type
      switch (event.type) {
        case 'goal':
        case 'penalty':
          playerUpdates[playerId].scored_goals += 1;
          break;
        case 'yellow_card':
          playerUpdates[playerId].yellow_cards += 1;
          break;
        case 'red_card':
          playerUpdates[playerId].red_cards += 1;
          break;
        default:
          console.warn('Unknown event type:', event.type);
          break;
      }
    }

    if (Object.keys(playerUpdates).length === 0) {
      console.warn('No player updates to process');
      return false;
    }

    // Update all players in the database with their final statistics
    console.log('Final player updates before saving:', playerUpdates);

    const updatePromises = Object.entries(playerUpdates).map(async ([playerId, stats]) => {
      console.log(`Updating player ${playerId} with final stats:`, stats);
      try {
        const result = await pb.collection('players').update(playerId, stats);
        console.log(`Player ${playerId} update result:`, result);
        return result;
      } catch (err) {
        console.error(`Error updating player ${playerId}:`, err);
        throw err;
      }
    });

    const results = await Promise.all(updatePromises);
    console.log('All player updates completed:', results.length);

    return results.length > 0;
  } catch (error) {
    console.error('Error updating player statistics:', error);
    throw new Error(`Failed to update player statistics: ${error.message}`);
  }
};

// Optimized function to update only players involved in a specific match
const updatePlayerStatsForMatch = async (matchId) => {
  try {
    console.log(`Starting player statistics update for match: ${matchId}`);
    
    if (!matchId) {
      throw new Error('Match ID is required for updating player statistics');
    }
    
    // 1. Get the match details, including MOTM
    const match = await pb.collection('matches').getOne(matchId, {
      expand: 'home_team,away_team,man_of_the_match,matchday'
    });
    
    if (!match) {
      throw new Error(`Match with ID ${matchId} not found`);
    }
    
    if (!match.is_finished) {
      console.log(`Match ${matchId} is not finished yet, skipping player stats update`);
      return true;
    }
    
    console.log(`Processing match: ${match.expand?.home_team?.name || match.home_team} vs ${match.expand?.away_team?.name || match.away_team}`);
    
    // 2. Get events for this match
    const events = await pb.collection('events').getFullList({
      filter: `match="${matchId}"`,
      expand: 'player'
    });
    
    console.log(`Found ${events.length} events for match ${matchId}`);
    
    // Track players involved in this match and their stats
    const playerIds = new Set();
    
    // Add MOTM if present
    if (match.man_of_the_match) {
      playerIds.add(match.man_of_the_match);
    }
    
    // Add players from events
    for (const event of events) {
      if (!event.player) continue;
      playerIds.add(event.player);
    }
    
    if (playerIds.size === 0) {
      console.log(`No players involved in match ${matchId}, nothing to update`);
      return true;
    }
    
    console.log(`Found ${playerIds.size} players involved in this match`);
    
    // Instead of incrementally updating, we'll recalculate the stats for these players
    // This avoids duplication issues when a match is saved multiple times
    await recalculatePlayersStats(Array.from(playerIds), match.matchday);
    
    console.log(`Successfully updated statistics for ${playerIds.size} players`);
    return true;
  } catch (error) {
    console.error(`Error updating player statistics for match ${matchId}:`, error);
    throw error;
  }
};

// Helper function to recalculate stats for specific players
const recalculatePlayersStats = async (playerIds, matchdayId) => {
  try {
    if (!playerIds.length) return false;
    
    console.log(`Recalculating stats for ${playerIds.length} players...`);
    
    // First reset stats for these players
    const resetPromises = playerIds.map(playerId => {
      return pb.collection('players').update(playerId, {
        scored_goals: 0,
        yellow_cards: 0,
        red_cards: 0,
        man_of_the_match: 0
      });
    });
    
    await Promise.all(resetPromises);
    console.log(`Reset stats for ${playerIds.length} players`);
    
    // Get season/edition ID from the matchday
    const matchday = await pb.collection('matchdays').getOne(matchdayId);
    if (!matchday || !matchday.season) {
      throw new Error(`Invalid matchday ID or missing season: ${matchdayId}`);
    }
    
    // Get all matchdays for this edition
    const matchdays = await pb.collection('matchdays').getFullList({
      filter: `season = "${matchday.season}"`
    });
    const matchdayIds = matchdays.map(md => md.id);
    
    // Get all finished matches for these matchdays
    let matches = [];
    for (const id of matchdayIds) {
      const matchdayMatches = await pb.collection('matches').getFullList({
        filter: `matchday = "${id}" && is_finished = true`
      });
      matches.push(...matchdayMatches);
    }
    
    // Calculate MOTM counts
    const playerStats = {};
    playerIds.forEach(id => {
      playerStats[id] = {
        scored_goals: 0,
        yellow_cards: 0,
        red_cards: 0,
        man_of_the_match: 0
      };
    });
    
    // Process MOTM from all matches
    for (const match of matches) {
      if (match.man_of_the_match && playerIds.includes(match.man_of_the_match)) {
        playerStats[match.man_of_the_match].man_of_the_match += 1;
      }
    }
    
    // Get all events for these players across all matches
    const matchFilter = matchdayIds.map(id => `match.matchday = "${id}"`).join(' || ');
    const playerFilter = playerIds.map(id => `player = "${id}"`).join(' || ');
    
    const events = await pb.collection('events').getFullList({
      filter: `(${playerFilter}) && (${matchFilter})`,
      expand: 'player,match'
    });
    
    console.log(`Found ${events.length} events for players across all matches`);
    
    // Process events
    for (const event of events) {
      if (!event.player || !playerStats[event.player]) continue;
      
      switch (event.type) {
        case 'goal':
        case 'penalty':
          playerStats[event.player].scored_goals += 1;
          break;
        case 'yellow_card':
          playerStats[event.player].yellow_cards += 1;
          break;
        case 'red_card':
          playerStats[event.player].red_cards += 1;
          break;
      }
    }
    
    // Save updated stats
    const updatePromises = Object.entries(playerStats).map(([playerId, stats]) => {
      return pb.collection('players').update(playerId, stats);
    });
    
    await Promise.all(updatePromises);
    return true;
  } catch (error) {
    console.error('Error recalculating player stats:', error);
    throw error;
  }
};
