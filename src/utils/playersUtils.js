import { pb } from '../config';

export const updatePlayerStatistics = async () => {
  try {
    console.log('Starting complete player statistics update');
    
    // 1. First get all players and reset their statistics
    const players = await pb.collection('players').getFullList();
    console.log('Fetched all players:', players);

    // Reset all player statistics
    const resetPromises = players.map(async (player) => {
      const resetStats = {
        scored_goals: 0,
        yellow_cards: 0,
        red_cards: 0,
        man_of_the_match: 0
      };
      console.log(`Resetting stats for player ${player.id}:`, resetStats);
      return await pb.collection('players').update(player.id, resetStats);
    });

    await Promise.all(resetPromises);
    console.log('All player statistics reset to zero');

    // 2. Fetch ALL events from ALL matches
    const events = await pb.collection('events').getFullList({
      expand: 'player,match'
    });

    console.log('Fetched all events:', events);

    // 3. Process each event and collect player statistics updates
    const playerUpdates = {};

    for (const event of events) {
      if (!event.player) continue;
      
      const playerId = event.player;
      console.log('Processing event:', event);

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
        case 'man_of_the_match':
          playerUpdates[playerId].man_of_the_match += 1;
          break;
        default:
          break;
      }

      console.log('Updated stats for player:', {
        playerId,
        stats: playerUpdates[playerId]
      });
    }

    // 4. Update all players in the database with their final statistics
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
    console.log('All player updates completed:', results);

    return true;
  } catch (error) {
    console.error('Error updating player statistics:', error);
    throw new Error(`Failed to update player statistics: ${error.message}`);
  }
};
