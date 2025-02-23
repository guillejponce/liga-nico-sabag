import React, { useState, useEffect } from 'react';
import { useTeamPlayers } from '../../hooks/players/useTeamPlayers';
import { 
  Goal, 
  AlertTriangle, 
  UserMinus, 
  Trophy,
  Loader2,
  Plus,
  X,
  Save
} from 'lucide-react';
import { createEvent, deleteEvent, fetchEvents } from '../../hooks/admin/matchEventHandlers';
import { updatePlayerStatistics } from '../../utils/playersUtils';
import { toast } from 'react-toastify';
import { pb } from '../../config';

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

const eventTypes = [
  { value: 'goal', label: 'Goal' },
  { value: 'yellow_card', label: 'Yellow Card' },
  { value: 'red_card', label: 'Red Card' },
];

const AdminMatchEvents = ({ match, onClose, updateMatchEvents }) => {
  console.log('Match data:', match);
  
  const { players: homePlayers, loading: homeLoading } = useTeamPlayers(match.home_team_id);
  const { players: awayPlayers, loading: awayLoading } = useTeamPlayers(match.away_team_id);
  
  console.log('Home players:', homePlayers);
  console.log('Away players:', awayPlayers);

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTeam, setSelectedTeam] = useState('home');
  const [eventType, setEventType] = useState(eventTypes[0].value);
  const [selectedPlayer, setSelectedPlayer] = useState('');
  const [saveStatus, setSaveStatus] = useState(null);

  useEffect(() => {
    loadEvents();
  }, [match.id]);

  const loadEvents = async () => {
    try {
      const response = await pb.collection('events').getList(1, 50, {
        filter: `match="${match.id}"`,
        sort: '+created',
        expand: 'player,player.team',
        $autoCancel: false
      });
      
      // Transform the events to ensure player data is accessible
      const transformedEvents = response.items.map(event => {
        console.log('Raw event data:', event); // Debug log
        return {
          ...event,
          player_name: event.expand?.player 
            ? `${event.expand.player.first_name} ${event.expand.player.last_name}`
            : (event.player ? `Unknown Player (${event.player})` : 'Unknown Player')
        };
      });
      
      console.log('Transformed events:', transformedEvents);
      setEvents(transformedEvents);
      return transformedEvents;
    } catch (error) {
      console.error('Error loading events:', error);
      toast.error('Failed to load match events');
      return [];
    } finally {
      setLoading(false);
    }
  };

  const handleAddEvent = async () => {
    if (!eventType || !selectedPlayer) {
      toast.error('Please select both player and event type');
      return;
    }

    try {
      const selectedPlayerData = currentPlayers.find(p => p.id === selectedPlayer);
      const eventData = {
        type: eventType,
        player: selectedPlayer,
        match: match.id,
        team: selectedTeam === 'home' ? match.home_team_id : match.away_team_id,
        player_name: selectedPlayerData?.name
      };
      
      console.log('Saving event data:', eventData);
      
      await createEvent(eventData);
      const updatedEvents = await loadEvents();
      await updateMatchEvents(updatedEvents);
      
      // Update stats after adding event
      await handleSaveStats();
      
      setEventType(eventTypes[0].value);
      setSelectedPlayer('');
      toast.success('Event added successfully');
    } catch (error) {
      console.error('Error adding event:', error);
      toast.error('Failed to add event');
    }
  };

  const handleRemoveEvent = async (eventId) => {
    try {
      await deleteEvent(eventId);
      await loadEvents();
      
      // Update stats after removing event
      await handleSaveStats();
      
      toast.success('Event removed successfully');
    } catch (error) {
      console.error('Error removing event:', error);
      toast.error('Failed to remove event');
    }
  };

  // Format the players data correctly
  const formatPlayers = (players) => {
    return players?.map(player => ({
      id: player.id,
      name: `${player.first_name} ${player.last_name}`
    })) || [];
  };

  // Get the current team's players based on selection
  const currentPlayers = selectedTeam === 'home' 
    ? formatPlayers(homePlayers)
    : formatPlayers(awayPlayers);

  const isLoading = homeLoading || awayLoading || loading;

  const handleSaveStats = async () => {
    try {
      setSaveStatus('saving');
      console.log('Starting to update player statistics...');
      
      // Get current events to verify they exist
      const currentEvents = await pb.collection('events').getFullList({
        filter: `match = "${match.id}"`,
        expand: 'player'
      });
      console.log('Current events before updating stats:', currentEvents);
      
      const result = await updatePlayerStatistics();
      console.log('Update player statistics result:', result);
      
      if (result) {
        toast.success('Player statistics updated successfully');
        setSaveStatus('saved');
        // Reset status after 3 seconds
        setTimeout(() => setSaveStatus(null), 3000);
      } else {
        toast.warning('No statistics were updated');
        setSaveStatus(null);
      }
    } catch (error) {
      console.error('Error updating player statistics:', error);
      toast.error('Failed to update player statistics: ' + error.message);
      setSaveStatus('error');
      // Reset error status after 3 seconds
      setTimeout(() => setSaveStatus(null), 3000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Match Events</h2>
          <div className="flex space-x-2">
            <button
              onClick={handleSaveStats}
              disabled={saveStatus === 'saving'}
              className={`${
                saveStatus === 'saved'
                  ? 'bg-green-500 hover:bg-green-600'
                  : saveStatus === 'error'
                  ? 'bg-red-500 hover:bg-red-600'
                  : 'bg-blue-500 hover:bg-blue-600'
              } text-white font-bold py-2 px-4 rounded flex items-center space-x-1 transition-colors duration-200`}
            >
              <Save className="w-4 h-4" />
              <span>
                {saveStatus === 'saving'
                  ? 'Saving...'
                  : saveStatus === 'saved'
                  ? 'Saved!'
                  : saveStatus === 'error'
                  ? 'Error!'
                  : 'Save Stats'}
              </span>
            </button>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-4">Loading...</div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <h3 className="font-semibold mb-2">Add New Event</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">Team</label>
                    <select
                      value={selectedTeam}
                      onChange={(e) => setSelectedTeam(e.target.value)}
                      className="w-full p-2 border rounded"
                    >
                      <option value="home">{match.home_team?.name || match.home_team_id}</option>
                      <option value="away">{match.away_team?.name || match.away_team_id}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Player</label>
                    <select
                      value={selectedPlayer}
                      onChange={(e) => setSelectedPlayer(e.target.value)}
                      className="w-full p-2 border rounded"
                    >
                      <option value="">Select Player</option>
                      {currentPlayers.map(player => (
                        <option key={player.id} value={player.id}>
                          {player.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Event Type</label>
                    <select
                      value={eventType}
                      onChange={(e) => setEventType(e.target.value)}
                      className="w-full p-2 border rounded"
                    >
                      {eventTypes.map(type => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    onClick={handleAddEvent}
                    className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded flex items-center justify-center"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Event
                  </button>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Current Events</h3>
                <div className="space-y-2">
                  {events.map(event => {
                    console.log('Event data:', event);
                    
                    const EventIcon = getEventIcon(event.type);
                    const playerName = event.expand?.player 
                      ? `${event.expand.player.first_name} ${event.expand.player.last_name}`
                      : event.player_name || 'Unknown Player';
                    
                    console.log('Player name:', playerName);

                    return (
                      <div key={event.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div className="flex items-center space-x-2">
                          {EventIcon}
                          <span>{playerName}</span>
                          <span className="text-sm text-gray-500">
                            ({event.team === match.home_team_id ? 'Home' : 'Away'})
                          </span>
                        </div>
                        <button
                          onClick={() => handleRemoveEvent(event.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminMatchEvents;