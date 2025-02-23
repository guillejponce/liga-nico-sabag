import { pb } from '../../config';
import { fetchCurrentEdition } from './editionHandlers';

export const PHASE_OPTIONS = [
  { label: "Grupo A", value: "group_a" },
  { label: "Grupo B", value: "group_b" },
  { label: "Grupo Oro", value: "gold_group" },
  { label: "Grupo Plata", value: "silver_group" },
  { label: "Grupo Bronce", value: "bronze_group" },
  { label: "Semifinal Oro", value: "gold_semi" },
  { label: "Semifinal Plata", value: "silver_semi" },
  { label: "Semifinal Bronce", value: "bronze_semi" },
  { label: "Final Oro", value: "gold_final" },
  { label: "Final Plata", value: "silver_final" },
  { label: "Final Bronce", value: "bronze_final" },
];

export const fetchMatchdays = async (signal) => {
  try {
    const response = await pb.collection('matchdays').getFullList({
      sort: '-number',
      expand: 'season',
      $autoCancel: false,
      $cancelKey: 'matchdays',
      signal
    });
    return response;
  } catch (err) {
    if (err.name === 'AbortError' || err.message.includes('autocancelled')) {
      console.log('Request cancelled for matchdays');
      return [];
    }
    console.error('Error fetching matchdays:', err);
    throw err;
  }
};

export const createMatchday = async (matchdayData) => {
  try {
    console.log('Creating matchday with data:', matchdayData);

    if (!matchdayData || !matchdayData.date_time) {
      throw new Error('Matchday date_time is required and cannot be empty');
    }

    if (!PHASE_OPTIONS.find(option => option.value === matchdayData.phase)) {
      throw new Error('Invalid phase value');
    }

    const currentEdition = await fetchCurrentEdition();
    if (!currentEdition) {
      throw new Error('No current edition found. Please set a current edition before creating matchdays.');
    }

    // Fetch all matchdays for the current season and phase
    const existingMatchdays = await pb.collection('matchdays').getFullList({
      filter: `season = "${currentEdition.id}" && phase = "${matchdayData.phase}"`,
      sort: '+number'
    });

    // Find the highest number for this phase and season
    const maxNumber = existingMatchdays.length > 0 
      ? Math.max(...existingMatchdays.map(m => m.number))
      : 0;
    const nextNumber = maxNumber + 1;

    console.log(`Creating matchday number ${nextNumber} for phase ${matchdayData.phase}`);

    const newMatchdayData = {
      ...matchdayData,
      number: nextNumber,
      matches: [], // Initialize with empty matches array
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
