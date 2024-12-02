import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Trophy } from 'lucide-react';
import { pb } from '../config';
import { fetchMatchdays } from '../hooks/admin/matchdayHandlers';
import { fetchMatchesByMatchday } from '../hooks/admin/matchHandlers';
import { useTeams } from '../hooks/teams/useTeams';
import { getFreeTeams } from '../utils/matchUtils';
import Bracket from '../components/results/bracket';

const TeamDisplay = ({ team, isHome }) => {
  return (
    <div className="text-center w-5/12">
      <div className="relative w-16 h-16 mx-auto mb-3">
        {team?.logo ? (
          <img
            src={pb.getFileUrl(team, team.logo)}
            alt={team?.name}
            className="w-full h-full object-contain rounded-full bg-white p-1 shadow-md"
          />
        ) : (
          <div className="w-full h-full rounded-full bg-gray-100 flex items-center justify-center shadow-inner">
            <span className="text-gray-400 text-xl font-bold">
              {team?.name?.charAt(0) || '?'}
            </span>
          </div>
        )}
      </div>
      <h3 className="font-semibold text-text text-lg mb-1 truncate px-2">
        {team?.name || 'TBD'}
      </h3>
      {team && (
        <div className={`text-sm text-gray-500 ${isHome ? 'text-blue-600' : 'text-gray-500'}`}>
          {isHome ? 'Local' : 'Visitante'}
        </div>
      )}
    </div>
  );
};

const getEventIcon = (type) => {
  switch (type) {
    case 'goal':
      return '⚽';
    case 'yellow_card':
      return '🟨';
    case 'red_card':
      return '🟥';
    case 'substitution':
      return '🔄';
    default:
      return '•';
  }
};

const getEventLabel = (type) => {
  switch (type) {
    case 'goal':
      return 'Gol';
    case 'yellow_card':
      return 'Tarjeta Amarilla';
    case 'red_card':
      return 'Tarjeta Roja';
    case 'substitution':
      return 'Sustitución';
    default:
      return 'Evento';
  }
};

const MatchEventsModal = ({ match, onClose }) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadEvents = async () => {
      try {
        const response = await pb.collection('events').getList(1, 50, {
          filter: `match="${match.id}"`,
          sort: '+created',
          expand: 'player,player.team'
        });
        setEvents(response.items);
      } catch (error) {
        console.error('Error loading events:', error);
      } finally {
        setLoading(false);
      }
    };

    if (match?.id) {
      loadEvents();
    }
  }, [match?.id]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white p-6 rounded-lg">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">
              {match.home_team} vs {match.away_team}
            </h2>
            <button 
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
            >
              ×
            </button>
          </div>

          <div className="space-y-4">
            {events.length > 0 ? (
              events.map((event, index) => (
                <div 
                  key={event.id}
                  className={`relative flex items-center ${
                    index !== events.length - 1 ? 'pb-4' : ''
                  }`}
                >
                  {index !== events.length - 1 && (
                    <div className="absolute left-6 top-8 bottom-0 w-0.5 bg-gray-200" />
                  )}
                  
                  <div className="relative flex items-center w-full bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center space-x-4 w-full">
                      <div className="p-2 bg-gray-50 rounded-full">
                        {getEventIcon(event.type)}
                      </div>
                      
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
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <p className="text-gray-500">No hay eventos registrados</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const Schedule = () => {
  const [matchdays, setMatchdays] = useState([]);
  const [activeMatchday, setActiveMatchday] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const { teams } = useTeams();

  useEffect(() => {
    let mounted = true;
    const controller = new AbortController();
    
    const loadMatchdays = async () => {
      try {
        const fetchedMatchdays = await fetchMatchdays(controller.signal);
        
        if (!mounted) return;

        const sortedMatchdays = fetchedMatchdays.sort((a, b) => a.number - b.number);

        const matchdaysWithMatches = await Promise.all(
          sortedMatchdays.map(async (matchday) => {
            try {
              const matches = await fetchMatchesByMatchday(matchday.id, controller.signal);
              return {
                ...matchday,
                matches: matches.map(match => ({
                  ...match,
                  phase: matchday.phase
                })) || [],
              };
            } catch (err) {
              if (!err.message?.includes('autocancelled')) {
                console.warn(`Failed to load matches for matchday ${matchday.id}:`, err);
              }
              return {
                ...matchday,
                matches: [],
              };
            }
          })
        );
        
        if (mounted) {
          setMatchdays(matchdaysWithMatches.filter(Boolean));
          setActiveMatchday(matchdaysWithMatches[0]?.id || null);
          setLoading(false);
        }
      } catch (err) {
        if (!err.message?.includes('autocancelled')) {
          console.error('Error loading matchdays:', err);
          if (mounted) {
            setError('Failed to load schedule. Please try again.');
            setLoading(false);
          }
        }
      }
    };

    loadMatchdays();

    return () => {
      mounted = false;
      controller.abort();
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-body flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-body flex items-center justify-center text-red-500">
        {error}
      </div>
    );
  }

  const activeMatchdayData = matchdays.find((matchday) => matchday.id === activeMatchday);
  const freeTeams = getFreeTeams(activeMatchdayData, teams);
  const hasPlayoffs = matchdays.some(m => 
    m.phase === 'gold_semi' || 
    m.phase === 'gold_final' || 
    m.phase === 'silver_semi' || 
    m.phase === 'silver_final'
  );

  return (
    <div className="bg-body min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6 text-text">Calendario de la Liga</h1>
        
        {/* Matchday tabs */}
        <div className="flex flex-wrap mb-6">
          {matchdays.some(m => m.phase === 'regular') && (
            matchdays
              .filter(m => m.phase === 'regular')
              .map((matchday) => (
                <button
                  key={matchday.id}
                  onClick={() => setActiveMatchday(matchday.id)}
                  className={`px-4 py-2 mr-2 mb-2 rounded-md transition-colors ${
                    activeMatchday === matchday.id
                      ? 'bg-accent text-white shadow-md'
                      : 'bg-body-secondary text-text hover:bg-accent-light hover:shadow-sm'
                  }`}
                >
                  Jornada {matchday.number}
                </button>
              ))
          )}
          
          {hasPlayoffs && (
            <button
              onClick={() => setActiveMatchday(matchdays.find(m => 
                m.phase === 'gold_semi' || 
                m.phase === 'gold_final' || 
                m.phase === 'silver_semi' || 
                m.phase === 'silver_final'
              )?.id)}
              className={`px-4 py-2 mr-2 mb-2 rounded-md transition-colors ${
                activeMatchdayData?.phase !== 'regular'
                  ? 'bg-accent text-white shadow-md'
                  : 'bg-body-secondary text-text hover:bg-accent-light hover:shadow-sm'
              }`}
            >
              Playoffs
            </button>
          )}
        </div>

        {/* Show playoffs bracket only when viewing a playoff phase */}
        {hasPlayoffs && (
          activeMatchdayData?.phase === 'gold_semi' || 
          activeMatchdayData?.phase === 'gold_final' || 
          activeMatchdayData?.phase === 'silver_semi' || 
          activeMatchdayData?.phase === 'silver_final'
        ) && (
          <div className="mt-8 mb-12">
            <h2 className="text-2xl font-bold mb-6 text-text">Playoffs</h2>
            <Bracket 
              matches={matchdays
                .filter(md => 
                  md.phase === 'gold_semi' || 
                  md.phase === 'gold_final' || 
                  md.phase === 'silver_semi' || 
                  md.phase === 'silver_final'
                )
                .flatMap(md => md.matches)
                .map(match => ({
                  ...match,
                  phase: match.expand?.matchday?.phase || match.phase
                }))
              } 
            />
          </div>
        )}

        {/* Show regular matches grid only for regular phase */}
        <div>
          {activeMatchdayData?.matches && 
           activeMatchdayData.matches.length > 0 && 
           activeMatchdayData.phase === 'regular' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {activeMatchdayData.matches.map((match) => (
                <div key={match.id} className="bg-body-secondary rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow">
                  <div className="flex justify-between items-center mb-6 bg-gray-50 p-3 rounded-lg">
                    <div className="flex items-center text-text-dark">
                      <Calendar size={18} className="mr-2 text-blue-500" />
                      <span className="font-medium">{new Date(match.date_time).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center text-text-dark">
                      <Clock size={18} className="mr-2 text-blue-500" />
                      <span className="font-medium">
                        {new Date(match.date_time).toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <TeamDisplay team={match.expand?.home_team} isHome={true} />
                    
                    <div className="flex flex-col items-center">
                      {match.is_finished ? (
                        <div className="bg-gray-50 px-4 py-2 rounded-lg shadow-inner flex flex-col items-center">
                          <div className="text-2xl font-bold text-accent text-center">
                            {match.home_team_score} - {match.away_team_score}
                          </div>
                          <div className="text-xs text-gray-500 mt-1 text-center">Final</div>
                          <button
                            onClick={() => setSelectedMatch(match)}
                            className="mt-2 text-sm text-blue-600 hover:text-blue-800"
                          >
                            Ver detalles
                          </button>
                        </div>
                      ) : (
                        <div className="text-xl font-bold text-gray-400 text-center">VS</div>
                      )}
                      {match.events && match.events.length > 0 && (
                        <button
                          onClick={() => setSelectedMatch(match)}
                          className="mt-3 text-sm text-blue-600 hover:text-blue-800 flex items-center"
                        >
                          <Trophy size={16} className="mr-1" /> Ver eventos
                        </button>
                      )}
                    </div>
                    
                    <TeamDisplay team={match.expand?.away_team} isHome={false} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      {selectedMatch && (
        <MatchEventsModal
          match={selectedMatch}
          onClose={() => setSelectedMatch(null)}
        />
      )}
    </div>
  );
};

export default Schedule;