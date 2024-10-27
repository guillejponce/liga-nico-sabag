import { pb } from '../../config';

// Helper function to get headers with bearer token
const getHeaders = () => {
  const token = localStorage.getItem('bearerToken'); // Assuming token is stored in localStorage
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
};

export const fetchMatchdays = async () => {
  try {
    const response = await pb.collection('matchdays').getList(1, 30, {
      headers: getHeaders(),
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
    console.log('Received matchday data in createMatchday:', matchdayData);

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
    };

    const createdMatchday = await pb.collection('matchdays').create(newMatchdayData, {
      headers: getHeaders(),
    });
    console.log('Matchday created successfully:', createdMatchday);
    return createdMatchday;
  } catch (err) {
    console.error('Error in createMatchday:', err);
    throw new Error(`Failed to create matchday: ${err.message}`);
  }
};

export const updateMatchday = async (id, matchdayData) => {
  try {
    const updatedMatchday = await pb.collection('matchdays').update(id, matchdayData, {
      headers: getHeaders(),
    });
    console.log('Updated matchday:', updatedMatchday);
    return updatedMatchday;
  } catch (err) {
    console.error('Error updating matchday:', err);
    throw new Error(`Failed to update matchday: ${err.message}`);
  }
};

export const deleteMatchday = async (id) => {
  try {
    await pb.collection('matchdays').delete(id, {
      headers: getHeaders(),
    });
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
      headers: getHeaders(),
      sort: 'date_time',
    });
    console.log('Fetched all matchdays:', response);
    return response.items;
  } catch (err) {
    console.error('Error fetching all matchdays:', err);
    throw new Error('Failed to fetch matchdays. Please try again.');
  }
};
