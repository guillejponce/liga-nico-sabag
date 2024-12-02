import { pb } from '../../config';

// Helper function to get headers with bearer token
const getHeaders = () => {
  const token = localStorage.getItem('bearerToken');
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
};

export const FORMATIONS = [
  '2-3-1',
  '3-2-1',
  '2-2-2',
];

export const fetchTeamOfTheWeek = async (matchdayId) => {
  try {
    const resultList = await pb.collection('team_of_the_week').getList(1, 1, {
      filter: `matchday="${matchdayId}"`,
      expand: 'player1.team,player2.team,player3.team,player4.team,player5.team,player6.team,player7.team,matchday',
      fields: 'id,formation,matchday,player1,player2,player3,player4,player5,player6,player7,expand.player1.first_name,expand.player1.last_name,expand.player1.expand.team.id,expand.player1.expand.team.name,expand.player1.expand.team.logo,expand.player2.first_name,expand.player2.last_name,expand.player2.expand.team.id,expand.player2.expand.team.name,expand.player2.expand.team.logo,expand.player3.first_name,expand.player3.last_name,expand.player3.expand.team.id,expand.player3.expand.team.name,expand.player3.expand.team.logo,expand.player4.first_name,expand.player4.last_name,expand.player4.expand.team.id,expand.player4.expand.team.name,expand.player4.expand.team.logo,expand.player5.first_name,expand.player5.last_name,expand.player5.expand.team.id,expand.player5.expand.team.name,expand.player5.expand.team.logo,expand.player6.first_name,expand.player6.last_name,expand.player6.expand.team.id,expand.player6.expand.team.name,expand.player6.expand.team.logo,expand.player7.first_name,expand.player7.last_name,expand.player7.expand.team.id,expand.player7.expand.team.name,expand.player7.expand.team.logo'
    });

    if (resultList.items.length === 0) {
      return null;
    }

    return resultList.items[0];
  } catch (err) {
    console.error('Error fetching team of the week:', err);
    throw new Error('Failed to fetch team of the week. Please try again.');
  }
};

export const createTeamOfTheWeek = async (teamData) => {
  try {
    if (!teamData.matchday) {
      throw new Error('Matchday is required');
    }

    // Validate formation
    if (!FORMATIONS.includes(teamData.formation)) {
      throw new Error('Invalid formation selected');
    }

    // Validate that all player positions are filled
    for (let i = 1; i <= 7; i++) {
      if (!teamData[`player${i}`]) {
        throw new Error(`Player ${i} position must be filled`);
      }
    }

    // Create the record with admin authorization
    const createdTeam = await pb.collection('team_of_the_week').create(teamData);

    return createdTeam;
  } catch (err) {
    console.error('Error creating team of the week:', err);
    throw new Error(`Failed to create team of the week: ${err.message}`);
  }
};

export const updateTeamOfTheWeek = async (id, teamData) => {
  try {
    if (!FORMATIONS.includes(teamData.formation)) {
      throw new Error('Invalid formation selected');
    }

    // Validate that all player positions are filled
    for (let i = 1; i <= 7; i++) {
      if (!teamData[`player${i}`]) {
        throw new Error(`Player ${i} position must be filled`);
      }
    }

    // Update the record with admin authorization
    const updatedTeam = await pb.collection('team_of_the_week').update(id, teamData);

    return updatedTeam;
  } catch (err) {
    console.error('Error updating team of the week:', err);
    throw new Error(`Failed to update team of the week: ${err.message}`);
  }
};

export const deleteTeamOfTheWeek = async (id) => {
  try {
    // Delete the record with admin authorization
    await pb.collection('team_of_the_week').delete(id);
    return true;
  } catch (err) {
    console.error('Error deleting team of the week:', err);
    throw new Error(`Failed to delete team of the week: ${err.message}`);
  }
};

export const fetchAllTeamsOfTheWeek = async () => {
  try {
    const resultList = await pb.collection('team_of_the_week').getFullList({
      sort: '-created',
      expand: 'player1.team,player2.team,player3.team,player4.team,player5.team,player6.team,player7.team,matchday',
      fields: 'id,formation,matchday,player1,player2,player3,player4,player5,player6,player7,expand.player1.first_name,expand.player1.last_name,expand.player1.expand.team.id,expand.player1.expand.team.name,expand.player1.expand.team.logo,expand.player2.first_name,expand.player2.last_name,expand.player2.expand.team.id,expand.player2.expand.team.name,expand.player2.expand.team.logo,expand.player3.first_name,expand.player3.last_name,expand.player3.expand.team.id,expand.player3.expand.team.name,expand.player3.expand.team.logo,expand.player4.first_name,expand.player4.last_name,expand.player4.expand.team.id,expand.player4.expand.team.name,expand.player4.expand.team.logo,expand.player5.first_name,expand.player5.last_name,expand.player5.expand.team.id,expand.player5.expand.team.name,expand.player5.expand.team.logo,expand.player6.first_name,expand.player6.last_name,expand.player6.expand.team.id,expand.player6.expand.team.name,expand.player6.expand.team.logo,expand.player7.first_name,expand.player7.last_name,expand.player7.expand.team.id,expand.player7.expand.team.name,expand.player7.expand.team.logo'
    });
    
    return resultList;
  } catch (err) {
    console.error('Error fetching all teams of the week:', err);
    throw new Error('Failed to fetch teams of the week. Please try again.');
  }
};
