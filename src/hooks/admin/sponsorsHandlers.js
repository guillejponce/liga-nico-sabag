import { pb } from '../../config';

export const fetchSponsors = async () => {
  try {
    const resultList = await pb.collection('sponsors').getList(1, 50, {
      sort: '-created',
    });
    return resultList.items;
  } catch (err) {
    console.error('Error fetching sponsors:', err);
    throw new Error('Failed to fetch sponsors. Please try again.');
  }
};

export const createSponsor = async (sponsorData) => {
  try {
    if (!sponsorData.name) {
      throw new Error('Sponsor name is required');
    }

    const formData = new FormData();
    formData.append('name', sponsorData.name);
    
    if (sponsorData.image) {
      formData.append('image', sponsorData.image);
    }

    const createdSponsor = await pb.collection('sponsors').create(formData);
    return createdSponsor;
  } catch (err) {
    console.error('Error creating sponsor:', err);
    throw new Error(`Failed to create sponsor: ${err.message}`);
  }
};

export const updateSponsor = async (id, sponsorData) => {
  try {
    if (!sponsorData.name) {
      throw new Error('Sponsor name is required');
    }

    const formData = new FormData();
    formData.append('name', sponsorData.name);
    
    if (sponsorData.image) {
      formData.append('image', sponsorData.image);
    }

    const updatedSponsor = await pb.collection('sponsors').update(id, formData);
    return updatedSponsor;
  } catch (err) {
    console.error('Error updating sponsor:', err);
    throw new Error(`Failed to update sponsor: ${err.message}`);
  }
};

export const deleteSponsor = async (id) => {
  try {
    await pb.collection('sponsors').delete(id);
    return true;
  } catch (err) {
    console.error('Error deleting sponsor:', err);
    throw new Error(`Failed to delete sponsor: ${err.message}`);
  }
};
