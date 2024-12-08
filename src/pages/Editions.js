import React, { useState, useEffect } from 'react';
import { Trophy, Medal, Award, Star } from 'lucide-react';
import { pb } from '../config';
import { Loader2 } from 'lucide-react';

const Editions = () => {
  const [editions, setEditions] = useState([]);
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
        setEditions(Array.isArray(editionsData.items) ? editionsData.items : []);
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
        <h1 className="text-4xl font-bold text-center mb-12 text-gray-900">
          Historia del Torneo
        </h1>

        <div className="space-y-12">
          {editions.map((edition) => (
            <div key={edition.id} className="bg-white rounded-2xl shadow-xl overflow-hidden">
              {/* Edition Header */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-6 text-white">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-3xl font-bold">Edición {edition.number}</h2>
                    <p className="text-blue-100 mt-1">
                      {edition.year} - {edition.semester === "1" ? "Primer" : "Segundo"} Semestre
                    </p>
                  </div>
                  <Trophy className="w-12 h-12 text-yellow-400" />
                </div>
                {edition.description && (
                  <p className="mt-4 text-blue-50">{edition.description}</p>
                )}
              </div>

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
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Editions;
