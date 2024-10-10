import { useState, useEffect } from 'react';
import PocketBase from 'pocketbase';

const pb = new PocketBase('http://127.0.0.1:8090');

export function useTeams() {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchTeams() {
      try {
        setLoading(true);
        const records = await pb.collection('teams').getFullList({
          sort: '-created',
        });
        
        // Process the records to include the logo URL
        const processedTeams = records.map(team => ({
          ...team,
          logoUrl: team.logo ? pb.getFileUrl(team, team.logo) : null
        }));
        
        setTeams(processedTeams);
        setError(null);
      } catch (err) {
        console.error('Error fetching teams:', err);
        setError('Failed to fetch teams. Please try again later.');
      } finally {
        setLoading(false);
      }
    }

    fetchTeams();
  }, []);

  return { teams, loading, error };
}