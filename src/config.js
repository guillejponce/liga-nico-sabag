import PocketBase from 'pocketbase';

// Use an environment variable for the backend URL
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'https://api.liganicosabag.me';

// Create a PocketBase instance
const pb = new PocketBase(BACKEND_URL);

export { pb, BACKEND_URL };