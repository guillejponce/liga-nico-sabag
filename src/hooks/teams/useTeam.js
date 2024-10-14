import { useState, useEffect } from 'react';
import { pb } from '../../config';

export function useTeam(teamId) {
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchTeam() {
      try {
        setLoading(true);
        const record = await pb.collection('teams').getOne(teamId);
        
        // Process the record to include the logo URL
        const processedTeam = {
          ...record,
          logoUrl: record.logo ? pb.getFileUrl(record, record.logo) : null
        };
        
        setTeam(processedTeam);
        setError(null);
      } catch (err) {
        console.error('Error fetching team:', err);
        setError('Failed to fetch team details. Please try again later.');
      } finally {
        setLoading(false);
      }
    }

    if (teamId) {
      fetchTeam();
    }
  }, [teamId]);

  return { team, loading, error };
}