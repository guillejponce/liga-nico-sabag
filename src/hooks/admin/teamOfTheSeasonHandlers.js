import { pb } from '../../config';
import { fetchLatestEdition } from './editionHandlers';
import { FORMATIONS } from './teamOfTheWeekHandlers';

export const DIVISIONS = ['gold', 'silver'];

// Utility to build player expand fields list for queries
const playerExpandFields = Array.from({ length: 7 }, (_, i) => {
  const idx = i + 1;
  return `expand.player${idx}.first_name,expand.player${idx}.last_name,expand.player${idx}.expand.team.id,expand.player${idx}.expand.team.name,expand.player${idx}.expand.team.logo`;
}).join(',');

const playerExpandRelations = Array.from({ length: 7 }, (_, i) => `player${i + 1}.team`).join(',');

// Fetch latest Team of the Season (based on latest edition)
export const fetchLatestTeamOfTheSeason = async (division = 'gold') => {
  try {
    const latestEdition = await fetchLatestEdition();
    if (!latestEdition) return null;

    const resultList = await pb.collection('team_of_the_season').getList(1, 1, {
      filter: `edition="${latestEdition.id}" && division="${division}"`,
      expand: `${playerExpandRelations},edition`,
      fields: `id,edition,division,formation,player1,player2,player3,player4,player5,player6,player7,${playerExpandFields}`
    });

    return resultList.items[0] || null;
  } catch (err) {
    console.error('Error fetching latest team of the season:', err);
    throw new Error('Failed to fetch latest team of the season. Please try again.');
  }
};

export const fetchTeamOfTheSeason = async (editionId, division = 'gold') => {
  try {
    const resultList = await pb.collection('team_of_the_season').getList(1, 1, {
      filter: `edition="${editionId}" && division="${division}"`,
      expand: `${playerExpandRelations},edition`,
      fields: `id,edition,division,formation,player1,player2,player3,player4,player5,player6,player7,${playerExpandFields}`
    });

    return resultList.items[0] || null;
  } catch (err) {
    console.error('Error fetching team of the season:', err);
    throw new Error('Failed to fetch team of the season. Please try again.');
  }
};

export const createTeamOfTheSeason = async (teamData) => {
  try {
    if (!teamData.edition) {
      throw new Error('Edition is required');
    }
    if (!DIVISIONS.includes(teamData.division)) {
      throw new Error('Invalid division');
    }
    if (!teamData.formation || !FORMATIONS.includes(teamData.formation)) {
      throw new Error('Invalid formation selected');
    }
    // Validate that all player positions are filled
    for (let i = 1; i <= 7; i++) {
      if (!teamData[`player${i}`]) {
        throw new Error(`Player ${i} position must be filled`);
      }
    }

    const createdTeam = await pb.collection('team_of_the_season').create(teamData);
    return createdTeam;
  } catch (err) {
    console.error('Error creating team of the season:', err);
    throw new Error(`Failed to create team of the season: ${err.message}`);
  }
};

export const updateTeamOfTheSeason = async (id, teamData) => {
  try {
    if (!DIVISIONS.includes(teamData.division)) {
      throw new Error('Invalid division');
    }
    if (!teamData.formation || !FORMATIONS.includes(teamData.formation)) {
      throw new Error('Invalid formation selected');
    }
    for (let i = 1; i <= 7; i++) {
      if (!teamData[`player${i}`]) {
        throw new Error(`Player ${i} position must be filled`);
      }
    }

    const updatedTeam = await pb.collection('team_of_the_season').update(id, teamData);
    return updatedTeam;
  } catch (err) {
    console.error('Error updating team of the season:', err);
    throw new Error(`Failed to update team of the season: ${err.message}`);
  }
};

export const deleteTeamOfTheSeason = async (id) => {
  try {
    await pb.collection('team_of_the_season').delete(id);
    return true;
  } catch (err) {
    console.error('Error deleting team of the season:', err);
    throw new Error(`Failed to delete team of the season: ${err.message}`);
  }
};