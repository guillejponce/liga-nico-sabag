import React, { useState, useEffect } from 'react';
import { Trophy, Medal, Award, Star, Table2, ChevronDown, ChevronUp } from 'lucide-react';
import SoccerPitch from '../components/teams/SoccerPitch';
import { pb } from '../config';
import { Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const Editions = () => {
  const [editions, setEditions] = useState([]);
  const [teamsOfSeason, setTeamsOfSeason] = useState({});
  const [expandedEdition, setExpandedEdition] = useState(null);
  const [loading, setLoading] = useState(true);
  const [abortController, setAbortController] = useState(new AbortController());

  useEffect(() => {
    loadEditions();
    return () => {
      abortController.abort();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loadEditions = async () => {
    abortController.abort();
    const newController = new AbortController();
    setAbortController(newController);

    try {
      setLoading(true);
      const editionsData = await pb.collection('editions').getList(1, 50, {
        sort: '-year,-semester',
        expand: 'gold_champion,silver_champion,gold_second,silver_second,topscorer.team,player_of_the_tournament.team,top_goalkeeper.team',
        $cancelKey: 'editions-fetch',
        signal: newController.signal
      });
      
      if (!newController.signal.aborted) {
        const eds = Array.isArray(editionsData.items) ? editionsData.items : [];
        setEditions(eds);

        // --- Nuevo enfoque: obtener todos los equipos de la temporada en una sola consulta ---
        const editionIds = eds.map((e) => e.id);
        if (editionIds.length) {
          try {
            const tosList = await pb.collection('team_of_the_season').getFullList({
              filter: `edition ~ "${editionIds.join('" || edition ~ "')}"`,
              expand: 'player1.team,player2.team,player3.team,player4.team,player5.team,player6.team,player7.team,edition',
            });

            const tosMap = {};
            tosList.forEach((item) => {
              if (!tosMap[item.edition]) tosMap[item.edition] = {};
              tosMap[item.edition][item.division] = item;
            });
            setTeamsOfSeason(tosMap);
          } catch (err) {
            console.error('Error fetching teams of the season:', err);
          }
        }
      }
    } catch (error) {
      if (!error.message?.includes('autocancelled')) {
        console.error('Error loading editions:', error);
      }
    } finally {
      if (!newController.signal.aborted) {
        setLoading(false);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <span className="ml-2 text-lg">Loading editions...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900">
            Historia del Torneo
          </h1>
          <div className="flex gap-4">
            <Link
              to="/historical-table"
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg transition-colors duration-200"
            >
              <Table2 className="w-5 h-5" />
              <span>Tabla Histórica</span>
            </Link>
            <Link
              to="/historical-scorers"
              className="flex items-center gap-2 bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-3 rounded-lg transition-colors duration-200"
            >
              <Star className="w-5 h-5" />
              <span>Goleadores Históricos</span>
            </Link>
          </div>
        </div>

        {/* Disclaimer & Tabla goleadores histórica */}
        <div className="mb-10">
          <div className="bg-yellow-100 text-yellow-800 p-4 rounded-lg mb-4 text-sm">
            Nota: Los datos de goleadores comienzan a partir de la 2ª edición; la primera no tiene registro completo.
          </div>
        </div>

        <div className="space-y-6">
          {editions.map((edition) => {
            const isOpen = expandedEdition === edition.id;
            return (
              <div key={edition.id} className="bg-white rounded-2xl shadow-xl overflow-hidden">
                {/* Header button */}
                <button
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-800 p-6 text-white flex justify-between items-center focus:outline-none"
                  onClick={() => setExpandedEdition(isOpen ? null : edition.id)}
                >
                  <div className="flex items-center gap-4">
                    <Trophy className="w-8 h-8 text-yellow-400" />
                    <div className="text-left">
                      <h2 className="text-2xl font-bold">Edición {edition.number}</h2>
                      <p className="text-blue-100">
                        {edition.year} - {edition.semester === '1' ? 'Primer' : 'Segundo'} Semestre
                      </p>
                    </div>
                  </div>
                  {isOpen ? (
                    <ChevronUp className="w-6 h-6 text-white" />
                  ) : (
                    <ChevronDown className="w-6 h-6 text-white" />
                  )}
                </button>

                {isOpen && (
                  <div className="p-6">
                    {/* Champions Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                      {/* Gold Division */}
                      <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-6 border border-amber-200">
                        <h3 className="text-xl font-semibold text-amber-900 mb-4 flex items-center">
                          <Trophy className="w-6 h-6 mr-2 text-amber-600" />
                          División Oro
                        </h3>
                        <div className="space-y-4">
                          {/* Champion */}
                          {edition.expand?.gold_champion && (
                            <div className="flex items-center bg-white rounded-lg p-4 shadow-sm">
                              {edition.expand.gold_champion.logo && (
                                <img 
                                  src={pb.getFileUrl(edition.expand.gold_champion, edition.expand.gold_champion.logo)}
                                  alt={edition.expand.gold_champion.name}
                                  className="w-16 h-16 object-contain rounded-full border-2 border-amber-500"
                                />
                              )}
                              <div className="ml-4">
                                <p className="text-sm text-amber-800">Campeón</p>
                                <p className="font-semibold text-gray-900">{edition.expand.gold_champion.name}</p>
                              </div>
                            </div>
                          )}
                          {/* Runner-up */}
                          {edition.expand?.gold_second && (
                            <div className="flex items-center bg-white rounded-lg p-4 shadow-sm">
                              <img 
                                src={pb.getFileUrl(edition.expand.gold_second, edition.expand.gold_second.logo)}
                                alt={edition.expand.gold_second.name}
                                className="w-16 h-16 object-contain rounded-full border-2 border-gray-300"
                              />
                              <div className="ml-4">
                                <p className="text-sm text-gray-600">Subcampeón</p>
                                <p className="font-semibold text-gray-900">{edition.expand.gold_second.name}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Silver Division */}
                      <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 border border-gray-200">
                        <h3 className="text-xl font-semibold text-gray-700 mb-4 flex items-center">
                          <Medal className="w-6 h-6 mr-2 text-gray-500" />
                          División Plata
                        </h3>
                        <div className="space-y-4">
                          {/* Champion */}
                          {edition.expand?.silver_champion && (
                            <div className="flex items-center bg-white rounded-lg p-4 shadow-sm">
                              <img 
                                src={pb.getFileUrl(edition.expand.silver_champion, edition.expand.silver_champion.logo)}
                                alt={edition.expand.silver_champion.name}
                                className="w-16 h-16 object-contain rounded-full border-2 border-gray-400"
                              />
                              <div className="ml-4">
                                <p className="text-sm text-gray-600">Campeón</p>
                                <p className="font-semibold text-gray-900">{edition.expand.silver_champion.name}</p>
                              </div>
                            </div>
                          )}
                          {/* Runner-up */}
                          {edition.expand?.silver_second && (
                            <div className="flex items-center bg-white rounded-lg p-4 shadow-sm">
                              <img 
                                src={pb.getFileUrl(edition.expand.silver_second, edition.expand.silver_second.logo)}
                                alt={edition.expand.silver_second.name}
                                className="w-16 h-16 object-contain rounded-full border-2 border-gray-300"
                              />
                              <div className="ml-4">
                                <p className="text-sm text-gray-600">Subcampeón</p>
                                <p className="font-semibold text-gray-900">{edition.expand.silver_second.name}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Individual Awards */}
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
                      <h3 className="text-xl font-semibold text-blue-900 mb-6 flex items-center">
                        <Award className="w-6 h-6 mr-2 text-blue-600" />
                        Premios Individuales
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Top Scorer */}
                        {edition.expand?.topscorer && edition.expand.topscorer.expand?.team && (
                          <div className="bg-white rounded-lg p-4 shadow-sm">
                            <div className="flex items-center mb-3">
                              <Star className="w-5 h-5 text-yellow-500 mr-2" />
                              <h4 className="font-medium text-gray-900">Goleador</h4>
                            </div>
                            <div className="flex items-center">
                              {edition.expand.topscorer.expand.team.logo && (
                                <img 
                                  src={pb.getFileUrl(edition.expand.topscorer.expand.team, edition.expand.topscorer.expand.team.logo)}
                                  alt={edition.expand.topscorer.expand.team.name}
                                  className="w-12 h-12 object-contain rounded-full border-2 border-gray-200"
                                />
                              )}
                              <div className="ml-3">
                                <p className="font-medium text-gray-900">
                                  {edition.expand.topscorer.first_name} {edition.expand.topscorer.last_name}
                                </p>
                                <p className="text-sm text-gray-500">{edition.expand.topscorer.expand.team.name}</p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Player of the Tournament */}
                        {edition.expand?.player_of_the_tournament && edition.expand.player_of_the_tournament.expand?.team && (
                          <div className="bg-white rounded-lg p-4 shadow-sm">
                            <div className="flex items-center mb-3">
                              <Trophy className="w-5 h-5 text-purple-500 mr-2" />
                              <h4 className="font-medium text-gray-900">Jugador del Torneo</h4>
                            </div>
                            <div className="flex items-center">
                              {edition.expand.player_of_the_tournament.expand.team.logo && (
                                <img 
                                  src={pb.getFileUrl(edition.expand.player_of_the_tournament.expand.team, edition.expand.player_of_the_tournament.expand.team.logo)}
                                  alt={edition.expand.player_of_the_tournament.expand.team.name}
                                  className="w-12 h-12 object-contain rounded-full border-2 border-gray-200"
                                />
                              )}
                              <div className="ml-3">
                                <p className="font-medium text-gray-900">
                                  {edition.expand.player_of_the_tournament.first_name} {edition.expand.player_of_the_tournament.last_name}
                                </p>
                                <p className="text-sm text-gray-500">{edition.expand.player_of_the_tournament.expand.team.name}</p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Top Goalkeeper */}
                        {edition.expand?.top_goalkeeper && edition.expand.top_goalkeeper.expand?.team && (
                          <div className="bg-white rounded-lg p-4 shadow-sm">
                            <div className="flex items-center mb-3">
                              <Award className="w-5 h-5 text-green-500 mr-2" />
                              <h4 className="font-medium text-gray-900">Mejor Arquero</h4>
                            </div>
                            <div className="flex items-center">
                              {edition.expand.top_goalkeeper.expand.team.logo && (
                                <img 
                                  src={pb.getFileUrl(edition.expand.top_goalkeeper.expand.team, edition.expand.top_goalkeeper.expand.team.logo)}
                                  alt={edition.expand.top_goalkeeper.expand.team.name}
                                  className="w-12 h-12 object-contain rounded-full border-2 border-gray-200"
                                />
                              )}
                              <div className="ml-3">
                                <p className="font-medium text-gray-900">
                                  {edition.expand.top_goalkeeper.first_name} {edition.expand.top_goalkeeper.last_name}
                                </p>
                                <p className="text-sm text-gray-500">{edition.expand.top_goalkeeper.expand.team.name}</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    {/* Team of the Season */}
                    {teamsOfSeason[edition.id] && (teamsOfSeason[edition.id].gold || teamsOfSeason[edition.id].silver) && (
                      <div className="mt-8">
                        <h3 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                          <Trophy className="w-6 h-6 text-yellow-600" />
                          Equipo de la Temporada
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {['gold', 'silver'].map((div) => {
                            const team = teamsOfSeason[edition.id][div];
                            if (!team) return null;
                            return (
                              <div key={div} className="bg-white rounded-lg p-4 shadow-sm">
                                <h4 className="text-lg font-medium mb-4 text-gray-800">
                                  {div === 'gold' ? 'Copa de Oro' : 'Copa de Plata'}
                                </h4>
                                <div className="w-full aspect-[3/2]">
                                  <SoccerPitch
                                    formation={team.formation || '2-3-1'}
                                    players={[1,2,3,4,5,6,7].map((num)=>({
                                      position: num,
                                      firstName: team.expand[`player${num}`]?.first_name || '',
                                      lastName: team.expand[`player${num}`]?.last_name || '',
                                      expand: {
                                        team: team.expand[`player${num}`]?.expand?.team ? {
                                          id: team.expand[`player${num}`].expand.team.id,
                                          name: team.expand[`player${num}`].expand.team.name,
                                          logo: team.expand[`player${num}`].expand.team.logo,
                                          collectionId: '6hkvwfswk61t3b1',
                                          collectionName: 'teams',
                                        } : null,
                                      },
                                    }))}
                                    compact={true}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Editions;
