import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Trophy } from 'lucide-react';
import { pb } from '../config';
import { fetchMatchdays } from '../hooks/admin/matchdayHandlers';
import { fetchMatchesByMatchday } from '../hooks/admin/matchHandlers';
import {  fetchCurrentEdition } from '../hooks/admin/editionHandlers';

const PHASE_LABELS = {
  group_a: "Grupo A",
  group_b: "Grupo B",
  gold_group: "Grupo Oro",
  silver_group: "Grupo Plata",
  bronze_group: "Grupo Bronce",
  gold_semi: "Semifinal Oro",
  silver_semi: "Semifinal Plata",
  bronze_semi: "Semifinal Bronce",
  gold_final: "Final Oro",
  silver_final: "Final Plata",
  bronze_final: "Final Bronce",
};

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
  const [motm, setMotm] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [eventsResponse, matchData] = await Promise.all([
          pb.collection('events').getList(1, 50, {
            filter: `match="${match.id}"`,
            sort: '+created',
            expand: 'player,player.team'
          }),
          pb.collection('matches').getOne(match.id, {
            expand: 'man_of_the_match,man_of_the_match.team'
          })
        ]);
        setEvents(eventsResponse.items);
        setMotm(matchData.expand?.man_of_the_match);
      } catch (error) {
        console.error('Error loading match data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (match?.id) {
      loadData();
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

          {/* MOTM Section */}
          {motm && (
            <div className="mb-6 p-4 bg-accent/10 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Trophy className="w-6 h-6 text-accent" />
                  <div>
                    <h3 className="font-semibold text-lg">Jugador del Partido</h3>
                    <p className="text-gray-600">
                      {`${motm.first_name} ${motm.last_name}`}
                      <span className="text-accent ml-2">
                        ({motm.expand?.team?.name})
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

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
  const [activePhase, setActivePhase] = useState(null);
  const [selectedMatchday, setSelectedMatchday] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [currentEdition, setCurrentEdition] = useState(null);


  // Group matchdays by phase
  const matchdaysByPhase = matchdays.reduce((acc, matchday) => {
    if (!acc[matchday.phase]) {
      acc[matchday.phase] = [];
    }
    acc[matchday.phase].push(matchday);
    // Sort each phase's matchdays from newest to oldest
    acc[matchday.phase].sort((a, b) => b.number - a.number);
    return acc;
  }, {});

  // Get unique matchday numbers for the active phase
  const availableMatchdays = activePhase 
    ? [...new Set(matchdaysByPhase[activePhase]?.map(md => md.number))]
      .sort((a, b) => b - a) // Sort from newest to oldest
    : [];

  // Filter matchdays by both phase and selected matchday number
  const filteredMatchdays = activePhase 
    ? matchdaysByPhase[activePhase]?.filter(matchday => 
        selectedMatchday === 'all' || matchday.number === parseInt(selectedMatchday)
      )
    : [];

  // Reset selected matchday when phase changes
  useEffect(() => {
    setSelectedMatchday('all');
  }, [activePhase]);

  useEffect(() => {
    let mounted = true;
    const controller = new AbortController();
    
    const loadData = async () => {
      try {
        // First fetch current edition
        const edition = await fetchCurrentEdition();
        if (!mounted) return;
        
        if (!edition) {
          setError('No hay temporada activa en este momento.');
          setLoading(false);
          return;
        }
        
        setCurrentEdition(edition);

        // Then fetch matchdays for current edition
        const fetchedMatchdays = await fetchMatchdays(controller.signal);
        
        if (!mounted) return;

        // Filter matchdays by current edition
        const currentEditionMatchdays = fetchedMatchdays.filter(
          matchday => matchday.expand?.season?.id === edition.id
        );

        const sortedMatchdays = currentEditionMatchdays.sort((a, b) => b.number - a.number);

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
          const validMatchdays = matchdaysWithMatches.filter(Boolean);
          setMatchdays(validMatchdays);
          // Set active phase to the first available phase
          if (validMatchdays.length > 0) {
            setActivePhase(validMatchdays[0].phase);
          }
          setLoading(false);
        }
      } catch (err) {
        if (!err.message?.includes('autocancelled')) {
          console.error('Error loading schedule:', err);
          if (mounted) {
            setError('Error al cargar el calendario. Por favor, intente nuevamente.');
            setLoading(false);
          }
        }
      }
    };

    loadData();

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
      <div className="min-h-screen bg-body flex flex-col items-center justify-center p-4">
        <div className="text-center max-w-md">
          <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            {error === 'No hay temporada activa en este momento.' ? 'Sin Temporada Activa' : 'Error'}
          </h2>
          <p className="text-gray-600">
            {error === 'No hay temporada activa en este momento.' 
              ? 'No hay una temporada activa en este momento. Las fechas se mostrarán cuando se active una temporada.'
              : error}
          </p>
        </div>
      </div>
    );
  }

  if (matchdays.length === 0) {
    return (
      <div className="min-h-screen bg-body flex flex-col items-center justify-center p-4">
        <div className="text-center max-w-md">
          <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Sin Fechas Programadas
          </h2>
          <p className="text-gray-600">
            {currentEdition 
              ? `No hay fechas programadas para la temporada ${currentEdition.number} (${currentEdition.year} - ${currentEdition.semester === "1" ? "1er" : "2do"} Semestre).`
              : 'No hay fechas programadas para la temporada actual.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-body min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6 text-text">Calendario de la Liga</h1>
        
        {/* Filters section */}
        <div className="mb-6 space-y-4">
          {/* Phase tabs */}
          <div className="flex flex-wrap">
            {Object.keys(matchdaysByPhase).map((phase) => (
              <button
                key={phase}
                onClick={() => setActivePhase(phase)}
                className={`px-4 py-2 mr-2 mb-2 rounded-md transition-colors ${
                  activePhase === phase
                    ? 'bg-accent text-white shadow-md'
                    : 'bg-body-secondary text-text hover:bg-accent-light hover:shadow-sm'
                }`}
              >
                {PHASE_LABELS[phase] || phase}
              </button>
            ))}
          </div>

          {/* Matchday filter */}
          {activePhase && availableMatchdays.length > 0 && (
            <div className="flex items-center space-x-2">
              <label className="text-text font-medium">Filtrar por Jornada:</label>
              <select
                value={selectedMatchday}
                onChange={(e) => setSelectedMatchday(e.target.value)}
                className="px-4 py-2 rounded-md border border-gray-300 bg-white text-text focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="all">Todas las Jornadas</option>
                {availableMatchdays.map((number) => (
                  <option key={number} value={number}>
                    Jornada {number}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Show matches for filtered matchdays */}
        <div>
          {filteredMatchdays.map((matchday) => (
            <div key={matchday.id} className="mb-8">
              <h2 className="text-2xl font-bold mb-4 text-text">
                {PHASE_LABELS[matchday.phase]} - Jornada {matchday.number}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {matchday.matches.map((match) => (
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
            </div>
          ))}
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