import { useState, useEffect } from 'react';
import { pb } from '../../config';

export function useTeamPlayers(teamId) {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    const controller = new AbortController();

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
          $cancelKey: teamId,
          $autoCancel: false
        });
        
        if (mounted) {
          setPlayers(records.items);
          setError(null);
        }
      } catch (err) {
        if (err.name === 'AbortError' || err.message.includes('autocancelled')) {
          console.log('Request cancelled for team:', teamId);
          return;
        }
        console.error('Error fetching players:', err);
        if (mounted) {
          setError('Failed to fetch team players. Please try again later.');
          setPlayers([]);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    fetchPlayers();

    return () => {
      mounted = false;
      controller.abort();
    };
  }, [teamId]);

  return { players, loading, error };
}