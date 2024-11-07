import React, { useState, useEffect } from 'react';
import { useTeamPlayers } from '../../hooks/players/useTeamPlayers';
import { 
  Goal, 
  AlertTriangle, 
  UserMinus, 
  Trophy,
  Loader2 
} from 'lucide-react';
import { createEvent, deleteEvent, fetchEvents } from '../../hooks/admin/matchEventHandlers';

const EVENT_TYPES = {
  GOAL: 'goal',
  YELLOW_CARD: 'yellow_card',
  RED_CARD: 'red_card',
  SUBSTITUTION: 'substitution',
  OWN_GOAL: 'own_goal',
  PENALTY: 'penalty'
};

const getEventIcon = (type) => {
  switch (type.toLowerCase()) {
    case 'goal':
    case 'penalty':
      return <Goal className="w-5 h-5 text-green-600" />;
    case 'own_goal':
      return <Goal className="w-5 h-5 text-red-600" />;
    case 'yellow_card':
      return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
    case 'red_card':
      return <AlertTriangle className="w-5 h-5 text-red-600" />;
    case 'substitution':
      return <UserMinus className="w-5 h-5 text-blue-500" />;
    default:
      return <Trophy className="w-5 h-5 text-gray-500" />;
  }
};

const getEventLabel = (type) => {
  const labels = {
    goal: 'Goal',
    penalty: 'Penalty Goal',
    own_goal: 'Own Goal',
    yellow_card: 'Yellow Card',
    red_card: 'Red Card',
    substitution: 'Substitution'
  };
  return labels[type.toLowerCase()] || type;
};

const EditMatchEventsModal = ({ match, matchdayIndex, matchIndex, onClose, updateMatchEvents }) => {
  const { players: homePlayers, loading: homeLoading } = useTeamPlayers(match.home_team_id);
  const { players: awayPlayers, loading: awayLoading } = useTeamPlayers(match.away_team_id);
  const [selectedTeam, setSelectedTeam] = useState('');
  const [eventType, setEventType] = useState('');
  const [selectedPlayer, setSelectedPlayer] = useState('');
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadEvents = async () => {
      try {
        const fetchedEvents = await fetchEvents(match.id);
        setEvents(fetchedEvents);
      } catch (error) {
        console.error('Error loading events:', error);
      } finally {
        setLoading(false);
      }
    };

    loadEvents();
  }, [match.id]);

  const addEvent = async () => {
    if (!eventType || !selectedPlayer) return;
    
    try {
      const eventData = {
        type: eventType,
        player: selectedPlayer,
        match: match.id
      };
      
      await createEvent(eventData);
      // Fetch updated events list immediately after creation
      const updatedEvents = await fetchEvents(match.id);
      setEvents(updatedEvents);
      
      // Reset form
      setEventType('');
      setSelectedPlayer('');
      setSelectedTeam('');
    } catch (error) {
      console.error('Error adding event:', error);
    }
  };

  const removeEvent = async (eventId) => {
    try {
      await deleteEvent(eventId);
      // Refresh the events list after deletion
      const updatedEvents = await fetchEvents(match.id);
      setEvents(updatedEvents);
    } catch (error) {
      console.error('Error removing event:', error);
    }
  };

  const currentPlayers = selectedTeam === match.home_team_id ? homePlayers : 
                        selectedTeam === match.away_team_id ? awayPlayers : [];
  const isLoading = selectedTeam === match.home_team_id ? homeLoading : 
                    selectedTeam === match.away_team_id ? awayLoading : false;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">
              Match Events: {match.home_team} vs {match.away_team}
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
            <h3 className="font-semibold mb-4 text-lg">Match Timeline</h3>
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              </div>
            ) : events.length > 0 ? (
              <div className="space-y-4">
                {events.map((event, index) => (
                  <div 
                    key={event.id}
                    className={`relative flex items-center ${
                      index !== events.length - 1 ? 'pb-4' : ''
                    }`}
                  >
                    {/* Timeline line */}
                    {index !== events.length - 1 && (
                      <div className="absolute left-6 top-8 bottom-0 w-0.5 bg-gray-200" />
                    )}
                    
                    {/* Event card */}
                    <div className="relative flex items-center w-full bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center space-x-4 w-full">
                        {/* Icon */}
                        <div className="p-2 bg-gray-50 rounded-full">
                          {getEventIcon(event.type)}
                        </div>
                        
                        {/* Event details */}
                        <div className="flex-grow">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-gray-900">
                              {event.expand?.player ? 
                                `${event.expand.player.first_name} ${event.expand.player.last_name}` : 
                                'Unknown Player'}
                            </span>
                            <span className="text-sm text-gray-500">•</span>
                            <span className="text-sm text-gray-600">
                              {getEventLabel(event.type)}
                            </span>
                          </div>
                          <span className="text-sm text-gray-500">
                            {event.expand?.player?.team === match.home_team_id ? match.home_team : match.away_team}
                          </span>
                        </div>
                        
                        {/* Delete button */}
                        <button
                          onClick={() => removeEvent(event.id)}
                          className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50 transition-colors"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <p className="text-gray-500">No events recorded yet</p>
              </div>
            )}
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
                    setSelectedPlayer('');
                  }}
                >
                  <option value="">Select Team</option>
                  <option value={match.home_team_id}>{match.home_team}</option>
                  <option value={match.away_team_id}>{match.away_team}</option>
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
                    disabled={!selectedTeam}
                  >
                    <option value="">Select Player</option>
                    {currentPlayers?.map(player => (
                      <option key={player.id} value={player.id}>
                        {player.first_name} {player.last_name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            {/* Add Event Button */}
            <button
              onClick={addEvent}
              disabled={!eventType || !selectedPlayer || isLoading}
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