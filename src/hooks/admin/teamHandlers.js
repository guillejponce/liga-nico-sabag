import { pb } from '../../config';

export const fetchAllTeams = async () => {
    try {
      const resultList = await pb.collection('teams').getList(1, 100, {
        sort: 'name',
      });
      console.log('Fetched teams:', resultList);
      return resultList.items.reduce((acc, team) => {
        acc[team.id] = team.name;
        return acc;
      }, {});
    } catch (err) {
      console.error('Error fetching teams:', err);
      throw new Error('Failed to fetch teams. Please try again.');
    }
  };

  export const fetchTeams = async (searchFilter = '') => {
    try {
      let filter = '';
      if (searchFilter) {
        filter = `name~"${searchFilter}" || description~"${searchFilter}"`;
      }
  
      const resultList = await pb.collection('teams').getList(1, 50, {
        filter,
        sort: '-created',
        expand: 'captain_id',
      });
      console.log('Fetched teams:', resultList);
  
      return resultList.items.map(team => ({
        ...team,
        captain_name: (team.expand?.captain_id?.last_name + ', ' + team.expand?.captain_id?.first_name) || 'No Captain'
      }));
    } catch (err) {
      console.error('Error fetching teams:', err);
      throw new Error('Failed to fetch teams. Please try again.');
    }
  };
  
export const createTeam = async (teamData) => {
    try {
      console.log('Creating team with data:', teamData);
      const createdTeam = await pb.collection('teams').create(teamData);
      console.log('Team created successfully:', createdTeam);
      return createdTeam;
    } catch (err) {
      console.error('Error in createTeam:', err);
      throw new Error(`Failed to create team: ${err.message}`);
    }
  };
  
export const updateTeam = async (id, teamData) => {
    try {
      console.log('Updating team with ID:', id, 'and data:', teamData);
      const updatedTeam = await pb.collection('teams').update(id, teamData);
      console.log('Team updated successfully:', updatedTeam);
      return updatedTeam;
    } catch (err) {
      console.error('Error updating team:', err);
      throw new Error(`Failed to update team: ${err.message}`);
    }
  };
  
export const deleteTeam = async (id) => {
    try {
      await pb.collection('teams').delete(id);
      console.log('Deleted team with ID:', id);
      return true;
    } catch (err) {
      console.error('Error deleting team:', err);
      throw new Error(`Failed to delete team: ${err.message}`);
    }
  };