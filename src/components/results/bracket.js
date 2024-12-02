import React from 'react';
import { pb } from '../../config';

const TeamBracketDisplay = ({ team, score, penalties, isWinner }) => {
  return (
    <div className={`flex items-center gap-2 p-2 rounded-lg ${isWinner ? 'bg-green-100' : 'bg-white'}`}>
      <div className="w-8 h-8 rounded-full overflow-hidden bg-white shadow-sm flex-shrink-0">
        {team?.logo ? (
          <img
            src={pb.getFileUrl(team, team.logo)}
            alt={team?.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-50 text-gray-400 text-xs">
            {team?.name?.charAt(0) || '?'}
          </div>
        )}
      </div>
      <span className="font-medium flex-grow truncate">{team?.name || 'TBD'}</span>
      <div className="flex items-center gap-2">
        <span className={`font-bold ${isWinner ? 'text-green-700' : 'text-gray-400'}`}>
          {!team ? '-' : (score !== undefined && score !== null ? score : '-')}
        </span>
        {team && penalties !== undefined && penalties !== null && (
          <span className="text-sm text-gray-500">
            ({penalties})
          </span>
        )}
      </div>
    </div>
  );
};

const Bracket = ({ matches }) => {
  const goldSemis = matches.filter(match => match.phase === 'gold_semi')
    .slice(0, 2)
    .concat(Array(2 - matches.filter(match => match.phase === 'gold_semi').length)
      .fill({ phase: 'gold_semi', placeholder: true }));

  const silverSemis = matches.filter(match => match.phase === 'silver_semi')
    .slice(0, 2)
    .concat(Array(2 - matches.filter(match => match.phase === 'silver_semi').length)
      .fill({ phase: 'silver_semi', placeholder: true }));

  const goldFinal = matches.find(match => match.phase === 'gold_final') || 
    { phase: 'gold_final', placeholder: true };
    
  const silverFinal = matches.find(match => match.phase === 'silver_final') || 
    { phase: 'silver_final', placeholder: true };

  const getWinner = (match) => {
    // Si el partido no está terminado, es placeholder, no tiene equipos, o no tiene score definido, retorna null
    if (!match?.is_finished || 
        match.placeholder || 
        !match.expand?.home_team || 
        !match.expand?.away_team ||
        match.home_team_score === undefined || 
        match.home_team_score === null ||
        match.away_team_score === undefined || 
        match.away_team_score === null) return null;
    
    if (match.home_team_score === match.away_team_score) {
      // Si hay empate, el ganador se determina por penales
      return match.home_penalties > match.away_penalties ? 
        match.expand?.home_team : match.expand?.away_team;
    }
    
    return match.home_team_score > match.away_team_score ? 
      match.expand?.home_team : match.expand?.away_team;
  };

  return (
    <div className="space-y-12">
      {/* Gold Tournament */}
      <div className="relative">
        <h2 className="text-2xl font-bold text-yellow-600 mb-6 flex items-center gap-2">
          <div className="w-6 h-6 bg-yellow-200 rounded-full"></div>
          Copa Oro
        </h2>
        <div className="grid grid-cols-2 gap-8">
          {/* Semifinals Column */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-600 mb-4">Semifinales</h3>
            {goldSemis.map((match, idx) => (
              <div key={match.id || `gold-semi-${idx}`} className="bg-white rounded-lg shadow-md p-4">
                <TeamBracketDisplay 
                  team={match.expand?.home_team}
                  score={match.home_team_score}
                  penalties={match.home_team_penalties}
                  isWinner={!match.placeholder && getWinner(match)?.id === match.expand?.home_team?.id}
                />
                <div className="my-2 border-t border-gray-100"></div>
                <TeamBracketDisplay 
                  team={match.expand?.away_team}
                  score={match.away_team_score}
                  penalties={match.away_team_penalties}
                  isWinner={!match.placeholder && getWinner(match)?.id === match.expand?.away_team?.id}
                />
              </div>
            ))}
          </div>
          {/* Final Column */}
          <div>
            <h3 className="text-lg font-semibold text-gray-600 mb-4">Final</h3>
            <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-lg shadow-md p-4">
              <TeamBracketDisplay 
                team={goldFinal.expand?.home_team}
                score={goldFinal.home_team_score}
                penalties={goldFinal.home_team_penalties}
                isWinner={!goldFinal.placeholder && getWinner(goldFinal)?.id === goldFinal.expand?.home_team?.id}
              />
              <div className="my-2 border-t border-gray-100"></div>
              <TeamBracketDisplay 
                team={goldFinal.expand?.away_team}
                score={goldFinal.away_team_score}
                penalties={goldFinal.away_team_penalties}
                isWinner={!goldFinal.placeholder && getWinner(goldFinal)?.id === goldFinal.expand?.away_team?.id}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Silver Tournament */}
      <div className="relative">
        <h2 className="text-2xl font-bold text-gray-600 mb-6 flex items-center gap-2">
          <div className="w-6 h-6 bg-gray-200 rounded-full"></div>
          Copa Plata
        </h2>
        <div className="grid grid-cols-2 gap-8">
          {/* Semifinals Column */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-600 mb-4">Semifinales</h3>
            {silverSemis.map((match, idx) => (
              <div key={match.id || `silver-semi-${idx}`} className="bg-white rounded-lg shadow-md p-4">
                <TeamBracketDisplay 
                  team={match.expand?.home_team}
                  score={match.home_team_score}
                  penalties={match.home_team_penalties}
                  isWinner={!match.placeholder && getWinner(match)?.id === match.expand?.home_team?.id}
                />
                <div className="my-2 border-t border-gray-100"></div>
                <TeamBracketDisplay 
                  team={match.expand?.away_team}
                  score={match.away_team_score}
                  penalties={match.away_team_penalties}
                  isWinner={!match.placeholder && getWinner(match)?.id === match.expand?.away_team?.id}
                />
              </div>
            ))}
          </div>
          {/* Final Column */}
          <div>
            <h3 className="text-lg font-semibold text-gray-600 mb-4">Final</h3>
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg shadow-md p-4">
              <TeamBracketDisplay 
                team={silverFinal.expand?.home_team}
                score={silverFinal.home_team_score}
                penalties={silverFinal.home_team_penalties}
                isWinner={!silverFinal.placeholder && getWinner(silverFinal)?.id === silverFinal.expand?.home_team?.id}
              />
              <div className="my-2 border-t border-gray-100"></div>
              <TeamBracketDisplay 
                team={silverFinal.expand?.away_team}
                score={silverFinal.away_team_score}
                penalties={silverFinal.away_team_penalties}
                isWinner={!silverFinal.placeholder && getWinner(silverFinal)?.id === silverFinal.expand?.away_team?.id}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Bracket;
