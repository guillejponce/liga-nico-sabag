import { pb } from '../../config';

export const fetchEvents = async (matchId, signal) => {
  try {
    if (!matchId) {
      throw new Error('Match ID is required');
    }

    const response = await pb.collection('events').getList(1, 30, {
      filter: `match="${matchId}"`,
      sort: 'created',
      expand: 'player,player.team',
      $cancelKey: matchId,
      $autoCancel: false
    });

    // Transform the response to include expanded data
    const events = response.items.map(event => ({
      ...event,
      player_name: event.expand?.player ? 
        `${event.expand.player.first_name} ${event.expand.player.last_name}` : 
        'Unknown Player',
      team_id: event.expand?.player?.team
    }));

    return events;
  } catch (err) {
    if (err.name === 'AbortError' || err.message.includes('autocancelled')) {
      console.log('Request cancelled for match events:', matchId);
      return [];
    }
    console.error('Error fetching events:', err);
    throw err;
  }
};

export const createEvent = async (eventData) => {
  try {
    if (!eventData) {
      throw new Error('Event data is required');
    }

    const requiredFields = ['type', 'player', 'match'];
    for (const field of requiredFields) {
      if (!eventData[field]) {
        throw new Error(`${field} is required and cannot be empty`);
      }
    }

    const data = {
      type: eventData.type.toLowerCase(),
      player: eventData.player,
      match: eventData.match
    };

    console.log('Creating event with data:', data);
    const createdEvent = await pb.collection('events').create(data);
    console.log('Event created successfully:', createdEvent);
    return createdEvent;
  } catch (err) {
    console.error('Error in createEvent:', err);
    throw new Error(`Failed to create event: ${err.message}`);
  }
};

export const updateEvent = async (id, eventData) => {
  try {
    if (!id || !eventData) {
      throw new Error('Event ID and data are required');
    }

    const formattedEventData = {
      type: eventData.type.toLowerCase(),
      player: eventData.player,
      match: eventData.match
    };

    console.log('Updating event with ID:', id, 'and data:', formattedEventData);
    const updatedEvent = await pb.collection('events').update(id, formattedEventData);
    console.log('Event updated successfully:', updatedEvent);
    return updatedEvent;
  } catch (err) {
    console.error('Error updating event:', err);
    throw new Error(`Failed to update event: ${err.message}`);
  }
};

export const deleteEvent = async (eventId) => {
  try {
    if (!eventId) {
      throw new Error('Event ID is required');
    }

    await pb.collection('events').delete(eventId);
    console.log('Event deleted successfully:', eventId);
    return true;
  } catch (err) {
    console.error('Error in deleteEvent:', err);
    throw new Error(`Failed to delete event: ${err.message}`);
  }
};
