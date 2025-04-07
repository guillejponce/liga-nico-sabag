import { pb } from '../../config';

export const fetchGalleryImages = async () => {
  try {
    const resultList = await pb.collection('gallery').getFullList({
      sort: '-created',
      expand: 'team1,team2,matchday',
    });
    return resultList;
  } catch (err) {
    console.error('Error fetching gallery images:', err);
    throw new Error('Failed to fetch gallery images. Please try again.');
  }
};

export const uploadGalleryImage = async (imageFile, metadata, onProgress) => {
  try {
    const formData = new FormData();
    
    // Append the file with the correct field name 'image'
    const cleanFileName = imageFile.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const file = new File([imageFile], cleanFileName, { type: imageFile.type });
    formData.append('image', file);
    
    // Append metadata fields
    if (metadata.team1) {
      formData.append('team1', metadata.team1);
    }
    if (metadata.team2) {
      formData.append('team2', metadata.team2);
    }
    if (metadata.matchday) {
      formData.append('matchday', metadata.matchday);
    }

    // Add options to prevent request cancellation and handle upload progress
    const options = {
      $cancelKey: `upload_${Date.now()}`, // Unique key for each upload
      $autoCancel: false, // Prevent auto-cancellation
      onUploadProgress: (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onProgress?.(percentCompleted);
      }
    };

    const record = await pb.collection('gallery').create(formData, options);
    return record;
  } catch (err) {
    // Check if it's a cancellation error
    if (err.isAbort) {
      throw new Error('Upload was cancelled. Please try again.');
    }
    console.error('Error uploading image:', err);
    throw new Error(err.message || 'Failed to upload image. Please try again.');
  }
};

export const deleteGalleryImage = async (imageId) => {
  try {
    await pb.collection('gallery').delete(imageId);
  } catch (err) {
    console.error('Error deleting image:', err);
    throw new Error('Failed to delete image. Please try again.');
  }
};

export const fetchLatestMatchday = async () => {
  try {
    const resultList = await pb.collection('matchdays').getList(1, 1, {
      sort: '-date_time',
    });
    return resultList.items[0];
  } catch (err) {
    console.error('Error fetching latest matchday:', err);
    throw new Error('Failed to fetch latest matchday. Please try again.');
  }
};

export const fetchMatchdays = async () => {
  try {
    const resultList = await pb.collection('matchdays').getList(1, 5, {
      sort: '-date_time',
      fields: 'id,number,date_time,phase'
    });
    return resultList.items;
  } catch (err) {
    console.error('Error fetching matchdays:', err);
    throw new Error('Failed to fetch matchdays. Please try again.');
  }
};

export const fetchTeams = async () => {
  try {
    const resultList = await pb.collection('teams').getFullList({
      sort: 'name',
    });
    return resultList;
  } catch (err) {
    console.error('Error fetching teams:', err);
    throw new Error('Failed to fetch teams. Please try again.');
  }
}; 