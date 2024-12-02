import React from 'react';
import { pb } from '../../config';

const SoccerPitch = ({ formation = '4-2-1', players, expanded = false, compact = false }) => {
  const [defenders, midfielders, forwards] = (formation || '4-2-1').split('-').map(Number);
  
  const getPlayerPositions = () => {
    const defenderPositions = Array(defenders).fill(0).map((_, i) => i + 2);
    const midfielderPositions = Array(midfielders).fill(0).map((_, i) => i + 2 + defenders);
    const forwardPositions = Array(forwards).fill(0).map((_, i) => i + 2 + defenders + midfielders);
    
    return { defenderPositions, midfielderPositions, forwardPositions };
  };

  const { defenderPositions, midfielderPositions, forwardPositions } = getPlayerPositions();

  const renderPlayerCircle = (playerNumber, isKeeper = false) => {
    const player = players.find(p => p.position === playerNumber);
    const playerData = player ? {
      name: `${player.firstName} ${player.lastName}`,
      team: player.expand?.team,
    } : null;

    return (
      <div className="relative group flex flex-col items-center">
        <div className="relative w-8 h-8 sm:w-10 sm:h-10">
          <div className={`w-8 h-8 sm:w-10 sm:h-10 bg-white rounded-full border-2 ${isKeeper ? 'border-yellow-500' : 'border-green-600'} flex items-center justify-center overflow-hidden shadow-lg hover:scale-110 transition-transform`}>
            {playerData?.team?.logo ? (
              <img
                src={pb.getFileUrl(
                  { 
                    id: playerData.team.id,
                    collectionId: '6hkvwfswk61t3b1',
                    collectionName: 'teams',
                  }, 
                  playerData.team.logo
                )}
                alt={playerData.team.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-gray-400 text-xl">?</span>
            )}
          </div>
        </div>
        {playerData && (
          <span className="mt-1 text-[10px] sm:text-xs text-white font-medium bg-black bg-opacity-70 px-1.5 py-0.5 rounded-full whitespace-nowrap shadow-md">
            {playerData.name}
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="relative w-full h-full bg-gradient-to-b from-green-600 to-green-500 rounded-xl mx-auto overflow-hidden shadow-xl">
      {/* Field markings */}
      <div className="absolute inset-2 border-2 border-white opacity-80">
        {/* Center circle */}
        <div className="absolute w-20 h-20 sm:w-24 sm:h-24 left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 border-2 border-white rounded-full" />
        <div className="absolute w-2 h-2 left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-full" />
        {/* Horizontal halfway line */}
        <div className="absolute left-0 right-0 top-1/2 transform -translate-y-1/2 h-0.5 bg-white" />
        
        {/* Penalty areas */}
        <div className="absolute top-0 left-1/6 right-1/6 h-1/6 border-2 border-white" />
        <div className="absolute bottom-0 left-1/6 right-1/6 h-1/6 border-2 border-white" />
        
        {/* Goal areas */}
        <div className="absolute top-0 left-1/4 right-1/4 h-[8%] border-2 border-white" />
        <div className="absolute bottom-0 left-1/4 right-1/4 h-[8%] border-2 border-white" />
        
        {/* Corner arcs */}
        <div className="absolute top-0 left-0 w-6 h-6 border-r-2 border-white rounded-br-full" />
        <div className="absolute top-0 right-0 w-6 h-6 border-l-2 border-white rounded-bl-full" />
        <div className="absolute bottom-0 left-0 w-6 h-6 border-r-2 border-white rounded-tr-full" />
        <div className="absolute bottom-0 right-0 w-6 h-6 border-l-2 border-white rounded-tl-full" />
      </div>

      {/* Players */}
      <div className="absolute inset-0 flex flex-col justify-evenly py-4">
        {/* Forwards */}
        <div className="flex justify-evenly items-center px-4 sm:px-6">
          {forwardPositions.map(pos => (
            <div key={pos} className="flex-1 flex justify-center">
              {renderPlayerCircle(pos)}
            </div>
          ))}
        </div>

        {/* Midfielders */}
        <div className="flex justify-evenly items-center px-4 sm:px-6">
          {midfielderPositions.map(pos => (
            <div key={pos} className="flex-1 flex justify-center">
              {renderPlayerCircle(pos)}
            </div>
          ))}
        </div>

        {/* Defenders */}
        <div className="flex justify-evenly items-center px-4 sm:px-6">
          {defenderPositions.map(pos => (
            <div key={pos} className="flex-1 flex justify-center">
              {renderPlayerCircle(pos)}
            </div>
          ))}
        </div>

        {/* Goalkeeper */}
        <div className="flex justify-center items-center">
          {renderPlayerCircle(1, true)}
        </div>
      </div>
    </div>
  );
};

export default SoccerPitch;
