import { pb } from '../../config';

export const fetchEditions = async () => {
  try {
    const resultList = await pb.collection('editions').getList(1, 30, {
      sort: '-year,-semester',
      expand: 'gold_champion,silver_champion,gold_second,silver_second,topscorer,player_of_the_tournament,top_goalkeeper'
    });
    return resultList.items;
  } catch (err) {
    console.error('Error fetching editions:', err);
    throw new Error('Failed to fetch editions. Please try again.');
  }
};

export const createEdition = async (editionData) => {
  try {
    if (!editionData.number || !editionData.year || !editionData.semester) {
      throw new Error('Edition number, year and semester are required');
    }

    const formData = {
      number: editionData.number,
      year: editionData.year,
      semester: editionData.semester,
      description: editionData.description || '',
      gold_champion: editionData.gold_champion || '',
      silver_champion: editionData.silver_champion || '',
      gold_second: editionData.gold_second || '',
      silver_second: editionData.silver_second || '',
      topscorer: editionData.topscorer || '',
      player_of_the_tournament: editionData.player_of_the_tournament || '',
      top_goalkeeper: editionData.top_goalkeeper || ''
    };

    const createdEdition = await pb.collection('editions').create(formData);
    return createdEdition;
  } catch (err) {
    console.error('Error creating edition:', err);
    throw new Error(`Failed to create edition: ${err.message}`);
  }
};

export const updateEdition = async (id, editionData) => {
  try {
    if (!editionData.number || !editionData.year || !editionData.semester) {
      throw new Error('Edition number, year and semester are required');
    }

    const formData = {
      number: editionData.number,
      year: editionData.year,
      semester: editionData.semester,
      description: editionData.description || '',
      gold_champion: editionData.gold_champion || '',
      silver_champion: editionData.silver_champion || '',
      gold_second: editionData.gold_second || '',
      silver_second: editionData.silver_second || '',
      topscorer: editionData.topscorer || '',
      player_of_the_tournament: editionData.player_of_the_tournament || '',
      top_goalkeeper: editionData.top_goalkeeper || ''
    };

    const updatedEdition = await pb.collection('editions').update(id, formData);
    return updatedEdition;
  } catch (err) {
    console.error('Error updating edition:', err);
    throw new Error(`Failed to update edition: ${err.message}`);
  }
};

export const deleteEdition = async (id) => {
  try {
    await pb.collection('editions').delete(id);
  } catch (err) {
    console.error('Error deleting edition:', err);
    throw new Error(`Failed to delete edition: ${err.message}`);
  }
};

export const fetchEditionById = async (id) => {
  try {
    const edition = await pb.collection('editions').getOne(id, {
      expand: 'gold_champion,silver_champion,gold_second,silver_second,topscorer,player_of_the_tournament,top_goalkeeper'
    });
    return edition;
  } catch (err) {
    console.error('Error fetching edition:', err);
    throw new Error(`Failed to fetch edition: ${err.message}`);
  }
};

export const fetchLatestEdition = async () => {
  try {
    const resultList = await pb.collection('editions').getList(1, 1, {
      sort: '-year,-semester',
      expand: 'gold_champion,silver_champion,gold_second,silver_second,topscorer,player_of_the_tournament,top_goalkeeper'
    });
    return resultList.items[0] || null;
  } catch (err) {
    console.error('Error fetching latest edition:', err);
    throw new Error('Failed to fetch latest edition. Please try again.');
  }
};
