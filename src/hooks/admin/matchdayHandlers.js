import { pb } from '../../config';

export const fetchMatchdays = async () => {
  try {
    const response = await pb.collection('matchdays').getList(1, 30, {
      sort: '-created',
    });
    console.log('Fetched matchdays:', response);
    return response.items;
  } catch (err) {
    console.error('Error fetching matchdays:', err);
    throw new Error('Failed to fetch matchdays. Please try again.');
  }
};

export const createMatchday = async (matchdayData) => {
  try {
    console.log('Creating matchday with data:', matchdayData);

    if (!matchdayData || !matchdayData.date_time) {
      throw new Error('Matchday date_time is required and cannot be empty');
    }

    // Fetch all existing matchdays to determine the next matchday number
    const existingMatchdays = await fetchAllMatchdays();
    const maxNumber = existingMatchdays.reduce((max, matchday) => Math.max(max, matchday.number), 0);
    const nextNumber = maxNumber + 1;

    const newMatchdayData = {
      ...matchdayData,
      number: nextNumber,
      matches: [], // Initialize with empty matches array
    };

    const createdMatchday = await pb.collection('matchdays').create(newMatchdayData);
    console.log('Matchday created successfully:', createdMatchday);
    return createdMatchday;
  } catch (err) {
    console.error('Error in createMatchday:', err);
    throw new Error(`Failed to create matchday: ${err.message}`);
  }
};

export const updateMatchday = async (id, matchdayData) => {
  try {
    console.log('Updating matchday with ID:', id, 'and data:', matchdayData);
    const updatedMatchday = await pb.collection('matchdays').update(id, matchdayData);
    console.log('Matchday updated successfully:', updatedMatchday);
    return updatedMatchday;
  } catch (err) {
    console.error('Error updating matchday:', err);
    throw new Error(`Failed to update matchday: ${err.message}`);
  }
};

export const deleteMatchday = async (id) => {
  try {
    await pb.collection('matchdays').delete(id);
    console.log('Deleted matchday with ID:', id);
    return true;
  } catch (err) {
    console.error('Error deleting matchday:', err);
    throw new Error(`Failed to delete matchday: ${err.message}`);
  }
};

export const fetchAllMatchdays = async () => {
  try {
    const response = await pb.collection('matchdays').getList(1, 100, {
      sort: 'date_time',
    });
    console.log('Fetched all matchdays:', response);
    return response.items;
  } catch (err) {
    console.error('Error fetching all matchdays:', err);
    throw new Error('Failed to fetch matchdays. Please try again.');
  }
};
