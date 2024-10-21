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