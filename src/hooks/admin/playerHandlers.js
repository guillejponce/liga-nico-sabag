import { pb } from '../../config';

// Helper function to get headers with bearer token
const getHeaders = () => {
  const token = localStorage.getItem('bearerToken'); // Assuming token is stored in localStorage
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
};

export const fetchPlayers = async (searchFilter = '', teamFilter = '') => {
  try {
    let filter = '';
    if (searchFilter) {
      filter += `(first_name~"${searchFilter}" || last_name~"${searchFilter}")`;
    }
    if (teamFilter) {
      filter += filter ? ` && team="${teamFilter}"` : `team="${teamFilter}"`;
    }

    const resultList = await pb.collection('players').getList(1, 50, {
      headers: getHeaders(), // Add headers with bearer token
      filter,
      sort: '-created',
      expand: 'team',
    });
    console.log('Fetched players:', resultList);

    const teamMap = {};
    resultList.items.forEach(player => {
      if (player.expand && player.expand.team) {
        teamMap[player.team] = player.expand.team.name;
      }
    });

    return { players: resultList.items, teams: teamMap };
  } catch (err) {
    console.error('Error fetching players:', err);
    throw new Error('Failed to fetch players. Please try again.');
  }
};

export const createPlayer = async (playerData) => {
  try {
    console.log('Received player data in createPlayer:', playerData);

    if (!playerData) {
      throw new Error('Player data is null or undefined');
    }

    const requiredFields = ['rut', 'team', 'first_name', 'last_name'];
    for (const field of requiredFields) {
      if (!playerData[field]) {
        throw new Error(`${field} is required and cannot be empty`);
      }
    }

    console.log('JSON being sent in the request:', JSON.stringify(playerData, null, 2));

    const createdPlayer = await pb.collection('players').create(playerData, {
      headers: getHeaders(), // Add headers with bearer token
    });
    console.log('Player created successfully:', createdPlayer);
    return createdPlayer;
  } catch (err) {
    console.error('Error in createPlayer:', err);
    if (err.response) {
      console.error('Response data:', err.response.data);
      console.error('Response status:', err.response.status);
      console.error('Response headers:', err.response.headers);
    } else if (err.request) {
      console.error('No response received:', err.request);
    } else {
      console.error('Error message:', err.message);
    }
    throw new Error(`Failed to create player: ${err.message}`);
  }
};

export const updatePlayer = async (id, playerData) => {
  try {
    // Ensure numeric fields are converted to numbers
    const formattedData = {
      ...playerData,
      scored_goals: Number(playerData.scored_goals),
      yellow_cards: Number(playerData.yellow_cards),
      red_cards: Number(playerData.red_cards),
      man_of_the_match: Number(playerData.man_of_the_match),
    };

    const updatedPlayer = await pb.collection('players').update(id, formattedData, {
      headers: getHeaders(), // Add headers with bearer token
    });
    console.log('Updated player:', updatedPlayer);
    return updatedPlayer;
  } catch (err) {
    console.error('Error updating player:', err);
    throw new Error(`Failed to update player: ${err.message}`);
  }
};

export const deletePlayer = async (id) => {
  try {
    await pb.collection('players').delete(id, {
      headers: getHeaders(), // Add headers with bearer token
    });
    console.log('Deleted player with ID:', id);
    return true;
  } catch (err) {
    console.error('Error deleting player:', err);
    throw new Error(`Failed to delete player: ${err.message}`);
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
