import { useState, useEffect } from 'react';
import { pb } from '../../config';

export function useTeamPlayers(teamId) {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchPlayers() {
      if (!teamId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const records = await pb.collection('players').getList(1, 50, {
          filter: `team = "${teamId}"`,
          sort: 'last_name,first_name',
        });
        
        setPlayers(records.items);
        setError(null);
      } catch (err) {
        console.error('Error fetching players:', err);
        setError('Failed to fetch team players. Please try again later.');
        setPlayers([]);
      } finally {
        setLoading(false);
      }
    }

    fetchPlayers();
  }, [teamId]);

  return { players, loading, error };
}