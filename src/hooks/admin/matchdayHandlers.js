import { pb } from '../../config';
import { fetchCurrentEdition } from './editionHandlers';

export const fetchMatchdays = async (signal) => {
  try {
    const currentEdition = await fetchCurrentEdition();
    if (!currentEdition) {
      console.warn('No current edition found');
      return [];
    }

    const response = await pb.collection('matchdays').getList(1, 100, {
      sort: '-number',
      filter: `season = "${currentEdition.id}"`,
    });
    console.log('Fetched matchdays:', response.items);
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

    const currentEdition = await fetchCurrentEdition();
    if (!currentEdition) {
      throw new Error('No current edition found. Please set a current edition before creating matchdays.');
    }

    // Fetch all existing matchdays to determine the next matchday number
    const existingMatchdays = await fetchAllMatchdays();
    // Find the highest number and add 1
    const maxNumber = Math.max(...existingMatchdays.map(m => m.number), 0);
    const nextNumber = maxNumber + 1;

    const newMatchdayData = {
      ...matchdayData,
      number: nextNumber,
      matches: [], // Initialize with empty matches array
      phase: matchdayData.phase || 'regular', // Default to 'regular' if not provided
      season: currentEdition.id, // Set the season to current edition
    };

    const createdMatchday = await pb.collection('matchdays').create(newMatchdayData);
    console.log('Matchday created successfully:', createdMatchday);

    // Immediately fetch the updated list to ensure correct order
    const updatedMatchdays = await fetchMatchdays();
    return {
      createdMatchday,
      updatedMatchdays
    };
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
