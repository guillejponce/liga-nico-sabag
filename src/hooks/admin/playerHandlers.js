import { pb } from '../../config';

// Helper function to get headers with bearer token
const getHeaders = () => {
  const token = localStorage.getItem('bearerToken'); // Assuming token is stored in localStorage
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
};

export const fetchPlayers = async (searchFilter = '', teamFilter = '', signal) => {
  try {
    let filter = '';
    if (searchFilter) {
      filter += `(first_name~"${searchFilter}" || last_name~"${searchFilter}")`;
    }
    if (teamFilter) {
      filter += filter ? ` && team="${teamFilter}"` : `team="${teamFilter}"`;
    }

    const resultList = await pb.collection('players').getList(1, 50, {
      headers: getHeaders(),
      filter,
      sort: '-created',
      expand: 'team',
      $cancelKey: 'players-fetch',
      signal,
    });

    // Transform the response to include expanded team data
    const players = resultList.items.map(player => ({
      ...player,
      team: player.expand?.team?.id || player.team
    }));

    // Create a map of team IDs to team names
    const teams = resultList.items.reduce((acc, player) => {
      if (player.expand?.team) {
        acc[player.expand.team.id] = player.expand.team.name;
      }
      return acc;
    }, {});

    return { players, teams };
  } catch (err) {
    if (err.message?.includes('autocancelled')) {
      return { players: [], teams: {} };
    }
    console.error('Error fetching players:', err);
    throw new Error('Failed to fetch players. Please try again.');
  }
};

export const createPlayer = async (playerData) => {
  try {
    // Check if user is authenticated and is admin
    if (!pb.authStore.isValid) {
      throw new Error('No estás autenticado. Por favor, inicia sesión.');
    }

    // Log the current user's role for debugging
    console.log('Current user:', pb.authStore.model);
    console.log('Is admin?', pb.authStore.model?.role === 'admin');

    // Create the player record
    const createdPlayer = await pb.collection('players').create(playerData);
    console.log('Player created:', createdPlayer);
    
    return createdPlayer;
  } catch (err) {
    console.error('Error creating player:', err);
    throw new Error(`Error al crear jugador: ${err.message}`);
  }
};

export const updatePlayer = async (id, playerData) => {
  try {
    // Check if user is authenticated and is admin
    if (!pb.authStore.isValid) {
      throw new Error('No estás autenticado. Por favor, inicia sesión.');
    }

    // Log the current user's role for debugging
    console.log('Current user:', pb.authStore.model);
    console.log('Is admin?', pb.authStore.model?.role === 'admin');

    // Ensure numeric fields are converted to numbers
    const formattedData = {
      ...playerData,
      scored_goals: Number(playerData.scored_goals),
      yellow_cards: Number(playerData.yellow_cards),
      red_cards: Number(playerData.red_cards),
      man_of_the_match: Number(playerData.man_of_the_match),
    };

    const updatedPlayer = await pb.collection('players').update(id, formattedData);
    console.log('Updated player:', updatedPlayer);
    return updatedPlayer;
  } catch (err) {
    console.error('Error updating player:', err);
    throw new Error(`Error al actualizar jugador: ${err.message}`);
  }
};

export const deletePlayer = async (id) => {
  try {
    // Check if user is authenticated and is admin
    if (!pb.authStore.isValid) {
      throw new Error('No estás autenticado. Por favor, inicia sesión.');
    }

    // Log the current user's role for debugging
    console.log('Current user:', pb.authStore.model);
    console.log('Is admin?', pb.authStore.model?.role === 'admin');

    await pb.collection('players').delete(id);
    console.log('Deleted player with ID:', id);
    return true;
  } catch (err) {
    console.error('Error deleting player:', err);
    throw new Error(`Error al eliminar jugador: ${err.message}`);
  }
};

export const fetchAllPlayers = async () => {
  try {
    const resultList = await pb.collection('players').getList(1, 100, {
      headers: getHeaders(), // Add headers with bearer token
      sort: 'last_name,first_name',
    });
    console.log('Fetched all players:', resultList);
    return resultList.items;
  } catch (err) {
    console.error('Error fetching all players:', err);
    throw new Error('Failed to fetch players. Please try again.');
  }
};
