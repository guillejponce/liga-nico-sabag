import { useState, useEffect } from 'react';
import { pb } from '../../config';

export function useTeams() {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    const controller = new AbortController();

    async function fetchTeams() {
      try {
        setLoading(true);
        const records = await pb.collection('teams').getFullList({
          sort: 'name',
          expand: 'captain_id',
          $cancelKey: 'teams-fetch',
          signal: controller.signal
        });
        
        // Only update state if component is still mounted
        if (mounted) {
          // Process the records to include the logo URL and expanded data
          const processedTeams = records.map(team => ({
            ...team,
            logoUrl: team.logo ? pb.getFileUrl(team, team.logo) : null,
            captain_name: team.expand?.captain_id ? 
              `${team.expand.captain_id.last_name}, ${team.expand.captain_id.first_name}` : 
              'No Captain'
          }));
          
          setTeams(processedTeams);
          setError(null);
        }
      } catch (err) {
        // Only handle error if it's not a cancellation
        if (err.name === 'AbortError' || err.message?.includes('autocancelled')) {
          console.log('Teams fetch cancelled');
          return;
        }
        console.error('Error fetching teams:', err);
        if (mounted) {
          setError('Failed to fetch teams. Please try again later.');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    fetchTeams();

    // Cleanup function to handle unmounting
    return () => {
      mounted = false;
      controller.abort();
    };
  }, []); // Empty dependency array since we only want to fetch once

  const refreshTeams = async () => {
    const controller = new AbortController();
    try {
      setLoading(true);
      const records = await pb.collection('teams').getFullList({
        sort: 'name',
        expand: 'captain_id',
        $cancelKey: 'teams-refresh',
        signal: controller.signal
      });

      const processedTeams = records.map(team => ({
        ...team,
        logoUrl: team.logo ? pb.getFileUrl(team, team.logo) : null,
        captain_name: team.expand?.captain_id ? 
          `${team.expand.captain_id.last_name}, ${team.expand.captain_id.first_name}` : 
          'No Captain'
      }));

      setTeams(processedTeams);
      setError(null);
    } catch (err) {
      if (err.name === 'AbortError' || err.message?.includes('autocancelled')) {
        console.log('Teams refresh cancelled');
        return;
      }
      console.error('Error refreshing teams:', err);
      setError('Failed to refresh teams. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return { teams, loading, error, refreshTeams };
}