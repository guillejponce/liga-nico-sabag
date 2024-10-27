import React, { useState } from 'react';
import { useTeamPlayers } from '../../hooks/players/useTeamPlayers';
import { Goal, AlertTriangle, Clock, Loader2 } from 'lucide-react';

const EVENT_TYPES = {
  GOAL: 'Goal',
  YELLOW_CARD: 'Yellow Card',
  RED_CARD: 'Red Card',
  SUBSTITUTION: 'Substitution',
  OWN_GOAL: 'Own Goal',
  PENALTY: 'Penalty'
};

const EditMatchEventsModal = ({ match, matchdayIndex, matchIndex, onClose, updateMatchEvents }) => {
  const { players: homePlayers, loading: homeLoading } = useTeamPlayers(match.homeTeam);
  const { players: awayPlayers, loading: awayLoading } = useTeamPlayers(match.awayTeam);
  const [selectedTeam, setSelectedTeam] = useState('home');
  const [eventType, setEventType] = useState('');
  const [selectedPlayer, setSelectedPlayer] = useState('');
  const [minute, setMinute] = useState('');

  const addEvent = () => {
    if (!eventType || !selectedPlayer || !minute) return;
    
    const newEvent = {
      id: Date.now(),
      type: eventType,
      player: selectedPlayer,
      minute: parseInt(minute, 10),
      team: selectedTeam
    };
    
    const updatedEvents = [...(match.events || []), newEvent].sort((a, b) => a.minute - b.minute);
    updateMatchEvents(matchdayIndex, matchIndex, updatedEvents);
    
    // Reset form
    setEventType('');
    setSelectedPlayer('');
    setMinute('');
  };
  
  const removeEvent = (eventId) => {
    const updatedEvents = (match.events || []).filter(event => event.id !== eventId);
    updateMatchEvents(matchdayIndex, matchIndex, updatedEvents);
  };

  const getEventIcon = (type) => {
    switch (type) {
      case EVENT_TYPES.GOAL:
      case EVENT_TYPES.PENALTY:
      case EVENT_TYPES.OWN_GOAL:
        return <Goal className="w-4 h-4" />;
      case EVENT_TYPES.YELLOW_CARD:
      case EVENT_TYPES.RED_CARD:
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const currentPlayers = selectedTeam === 'home' ? homePlayers : awayPlayers;
  const isLoading = selectedTeam === 'home' ? homeLoading : awayLoading;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">
              Match Events: {match.homeTeam} vs {match.awayTeam}
            </h2>
            <button 
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
            >
              ×
            </button>
          </div>

          {/* Events Timeline */}
          <div className="mb-6">
            <h3 className="font-semibold mb-2">Match Timeline</h3>
            <div className="space-y-2">
              {match.events && match.events.length > 0 ? (
                match.events.map(event => (
                  <div 
                    key={event.id} 
                    className="flex items-center justify-between bg-gray-50 p-3 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="font-mono bg-gray-200 px-2 py-1 rounded">
                        {event.minute}'
                      </span>
                      {getEventIcon(event.type)}
                      <span className={`font-medium ${
                        event.team === 'home' ? 'text-blue-600' : 'text-red-600'
                      }`}>
                        {event.player}
                      </span>
                      <span className="text-gray-500">
                        {event.type}
                      </span>
                    </div>
                    <button
                      onClick={() => removeEvent(event.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      Delete
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">No events recorded yet</p>
              )}
            </div>
          </div>

          {/* Add New Event Form */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-4">Add New Event</h3>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              {/* Team Selection */}
              <div>
                <label className="block text-sm font-medium mb-1">Team</label>
                <select
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={selectedTeam}
                  onChange={(e) => {
                    setSelectedTeam(e.target.value);
                    setSelectedPlayer(''); // Reset player when team changes
                  }}
                >
                  <option value="home">{match.homeTeam}</option>
                  <option value="away">{match.awayTeam}</option>
                </select>
              </div>

              {/* Event Type Selection */}
              <div>
                <label className="block text-sm font-medium mb-1">Event Type</label>
                <select
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={eventType}
                  onChange={(e) => setEventType(e.target.value)}
                >
                  <option value="">Select Type</option>
                  {Object.values(EVENT_TYPES).map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              {/* Player Selection */}
              <div>
                <label className="block text-sm font-medium mb-1">Player</label>
                {isLoading ? (
                  <div className="flex items-center space-x-2 h-10">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm text-gray-500">Loading players...</span>
                  </div>
                ) : (
                  <select
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={selectedPlayer}
                    onChange={(e) => setSelectedPlayer(e.target.value)}
                  >
                    <option value="">Select Player</option>
                    {currentPlayers?.map(player => (
                      <option key={player.id} value={`${player.first_name} ${player.last_name}`}>
                        {player.first_name} {player.last_name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Minute Input */}
              <div>
                <label className="block text-sm font-medium mb-1">Minute</label>
                <input
                  type="number"
                  min="0"
                  max="90"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={minute}
                  onChange={(e) => setMinute(e.target.value)}
                  placeholder="Match minute"
                />
              </div>
            </div>

            {/* Add Event Button */}
            <button
              onClick={addEvent}
              disabled={!eventType || !selectedPlayer || !minute || isLoading}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              Add Event
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditMatchEventsModal;