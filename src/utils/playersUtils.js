import { pb } from '../config';
import { fetchCurrentEdition } from '../hooks/admin/editionHandlers';

export const updatePlayerStatistics = async () => {
  try {
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
