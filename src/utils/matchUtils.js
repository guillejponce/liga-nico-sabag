export const getFreeTeams = (matchday, allTeams) => {
  if (!matchday?.matches || !allTeams) return [];
  
  // Get all team IDs that are playing in this matchday
  const playingTeamIds = matchday.matches.reduce((acc, match) => {
    if (match.home_team_id) acc.push(match.home_team_id);
    if (match.away_team_id) acc.push(match.away_team_id);
    return acc;
  }, []);

  // Filter out teams that are playing
  return allTeams.filter(team => !playingTeamIds.includes(team.id));
}; 