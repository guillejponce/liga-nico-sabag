import { pb } from '../../config';

export const fetchMatchesByMatchday = async (matchdayId, signal) => {
  try {
    if (!matchdayId) {
      throw new Error('Matchday ID is required');
    }

    const response = await pb.collection('matches').getList(1, 50, {
      filter: `matchday="${matchdayId}"`,
      sort: 'date_time',
      expand: 'home_team,away_team',
      $cancelKey: matchdayId,
      $autoCancel: false
    });

    // Transform the response to include expanded team data
    const matches = response.items.map(match => ({
      ...match,
      home_team: match.expand?.home_team?.name || match.home_team,
      away_team: match.expand?.away_team?.name || match.away_team,
      home_team_logo: match.expand?.home_team?.logo,
      away_team_logo: match.expand?.away_team?.logo,
      home_team_id: match.home_team,
      away_team_id: match.away_team
    }));

    return matches;
  } catch (err) {
    if (err.name === 'AbortError' || err.message.includes('autocancelled')) {
      console.log('Request cancelled for matchday:', matchdayId);
      return [];
    }
    console.error('Error fetching matches:', err);
    throw err;
  }
};

export const createMatch = async (matchdayId) => {
  try {
    if (!matchdayId) {
      throw new Error('Matchday ID is required');
    }

    const matchData = {
      matchday: matchdayId,
      date_time: new Date().toISOString(),
      home_team: null,
      away_team: null,
      home_team_score: 0,
      away_team_score: 0,
      is_finished: false,
      events: []
    };

    console.log('Creating match with data:', matchData);
    const createdMatch = await pb.collection('matches').create(matchData);
    console.log('Match created successfully:', createdMatch);
    return createdMatch;
  } catch (err) {
    console.error('Error in createMatch:', err);
    throw new Error(`Failed to create match: ${err.message}`);
  }
};

export const updateMatch = async (id, matchData) => {
  try {
    // If match is being marked as finished, ensure scores are valid numbers
    if (matchData.is_finished === true) {
      const homeScore = Number(matchData.home_team_score ?? 0);
      const awayScore = Number(matchData.away_team_score ?? 0);
      
      // Update the matchData with converted scores
      matchData = {
        ...matchData,
        home_team_score: homeScore,
        away_team_score: awayScore
      };
    }

    console.log('Updating match with ID:', id, 'and data:', matchData);
    const updatedMatch = await pb.collection('matches').update(id, matchData);
    console.log('Match updated successfully:', updatedMatch);
    return updatedMatch;
  } catch (err) {
    console.error('Error updating match:', err);
    throw new Error(`Failed to update match: ${err.message}`);
  }
};

export const deleteMatch = async (id) => {
  try {
    await pb.collection('matches').delete(id);
    console.log('Deleted match with ID:', id);
    return true;
  } catch (err) {
    console.error('Error deleting match:', err);
    throw new Error(`Failed to delete match: ${err.message}`);
  }
};

