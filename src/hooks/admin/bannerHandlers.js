import { pb } from '../../config';

export const fetchBanners = async (activeOnly = false) => {
  try {
    const resultList = await pb.collection('banners').getList(1, 30, {
      sort: '-created',
      filter: activeOnly ? 'is_active=true' : ''
    });
    return resultList.items;
  } catch (err) {
    console.error('Error fetching banners:', err);
    throw new Error('Failed to fetch banners. Please try again.');
  }
};

export const createBanner = async (bannerData) => {
  try {
    if (!bannerData.title || !bannerData.description) {
      throw new Error('Banner title and description are required');
    }

    const formData = new FormData();
    formData.append('title', bannerData.title);
    formData.append('description', bannerData.description);
    formData.append('is_active', bannerData.is_active ?? true);
    
    if (bannerData.image) {
      formData.append('image', bannerData.image);
    }

    const createdBanner = await pb.collection('banners').create(formData);
    return createdBanner;
  } catch (err) {
    console.error('Error creating banner:', err);
    throw new Error(`Failed to create banner: ${err.message}`);
  }
};

export const updateBanner = async (id, bannerData) => {
  try {
    if (!bannerData.title || !bannerData.description) {
      throw new Error('Banner title and description are required');
    }

    const formData = new FormData();
    formData.append('title', bannerData.title);
    formData.append('description', bannerData.description);
    
    if (typeof bannerData.is_active === 'boolean') {
      formData.append('is_active', bannerData.is_active);
    }
    
    if (bannerData.image) {
      formData.append('image', bannerData.image);
    }

    const updatedBanner = await pb.collection('banners').update(id, formData);
    return updatedBanner;
  } catch (err) {
    console.error('Error updating banner:', err);
    throw new Error(`Failed to update banner: ${err.message}`);
  }
};

export const deleteBanner = async (id) => {
  try {
    await pb.collection('banners').delete(id);
    return true;
  } catch (err) {
    console.error('Error deleting banner:', err);
    throw new Error(`Failed to delete banner: ${err.message}`);
  }
};

export const toggleBannerStatus = async (id, isActive) => {
  try {
    const formData = new FormData();
    formData.append('is_active', !isActive);

    const updatedBanner = await pb.collection('banners').update(id, formData);
    return updatedBanner;
  } catch (err) {
    console.error('Error toggling banner status:', err);
    throw new Error(`Failed to toggle banner status: ${err.message}`);
  }
};
