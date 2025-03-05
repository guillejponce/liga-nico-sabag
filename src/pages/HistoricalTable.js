import React, { useState, useEffect } from 'react';
import { calculateHistoricalStats } from '../utils/historicalTableUtils';
import { Loader2, Trophy } from 'lucide-react';
import { pb } from '../config';

const HistoricalTable = () => {
  const [historicalStats, setHistoricalStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [abortController] = useState(new AbortController());

  // Helper function to get performance color
  const getPerformanceColor = (performance) => {
    const perf = parseFloat(performance);
    if (perf >= 70) return 'text-emerald-600 font-bold';
    if (perf >= 50) return 'text-blue-600';
    if (perf >= 30) return 'text-amber-600';
    return 'text-red-600';
  };

  // Helper function to get position background
  const getPositionStyle = (position) => {
    if (position === 1) return 'bg-gray-800 text-white font-bold';
    if (position === 2) return 'bg-gray-700 text-white font-bold';
    if (position === 3) return 'bg-gray-600 text-white font-bold';
    return 'text-gray-600';
  };

  useEffect(() => {
    const loadHistoricalStats = async () => {
      try {
        setLoading(true);
        setError(null);
        const stats = await calculateHistoricalStats(abortController.signal);
        setHistoricalStats(stats);
      } catch (err) {
        if (!err.message?.includes('autocancelled')) {
          console.error('Error cargando estadísticas históricas:', err);
          setError('Error al cargar las estadísticas históricas');
        }
      } finally {
        setLoading(false);
      }
    };

    loadHistoricalStats();

    return () => {
      abortController.abort();
    };
  }, [abortController]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <span className="ml-2 text-lg">Cargando estadísticas históricas...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-500 text-center">
          <p className="text-xl font-bold">Error</p>
          <p className="mt-2">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 to-green-800 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center space-x-3 mb-8">
          <Trophy className="w-8 h-8 text-yellow-400" />
          <h1 className="text-3xl font-bold text-white">Tabla Histórica</h1>
        </div>

        <div className="bg-white rounded-lg shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-gray-800 to-gray-900 text-white">
                  <th className="px-4 py-3 text-left">Pos</th>
                  <th className="px-4 py-3 text-left">Equipo</th>
                  <th className="px-4 py-3 text-center">PJ</th>
                  <th className="px-4 py-3 text-center">G</th>
                  <th className="px-4 py-3 text-center">E</th>
                  <th className="px-4 py-3 text-center">P</th>
                  <th className="px-4 py-3 text-center">GF</th>
                  <th className="px-4 py-3 text-center">GC</th>
                  <th className="px-4 py-3 text-center">DG</th>
                  <th className="px-4 py-3 text-center">Pts</th>
                  <th className="px-4 py-3 text-center">Rend %</th>
                </tr>
              </thead>
              <tbody>
                {historicalStats.map((stats, index) => (
                  <tr 
                    key={stats.team.id} 
                    className={`${
                      index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                    } hover:bg-gray-100 transition-colors duration-150 border-b border-gray-100`}
                  >
                    <td className={`px-4 py-3 text-center ${getPositionStyle(index + 1)}`}>
                      {index + 1}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-3">
                        {stats.team.logo && (
                          <img 
                            src={pb.getFileUrl(stats.team, stats.team.logo)} 
                            alt={stats.team.name}
                            className="w-8 h-8 rounded-full border-2 border-gray-200"
                          />
                        )}
                        <span className="font-medium text-gray-800">{stats.team.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center text-gray-600">{stats.matches_played}</td>
                    <td className="px-4 py-3 text-center text-gray-600">{stats.won_matches}</td>
                    <td className="px-4 py-3 text-center text-gray-600">{stats.drawn_matches}</td>
                    <td className="px-4 py-3 text-center text-gray-600">{stats.lost_matches}</td>
                    <td className="px-4 py-3 text-center text-gray-600">{stats.scored_goals}</td>
                    <td className="px-4 py-3 text-center text-gray-600">{stats.concieved_goals}</td>
                    <td className={`px-4 py-3 text-center font-medium ${
                      stats.goal_difference > 0 ? 'text-green-600' : 
                      stats.goal_difference < 0 ? 'text-red-600' : 
                      'text-gray-600'
                    }`}>
                      {stats.goal_difference > 0 ? `+${stats.goal_difference}` : stats.goal_difference}
                    </td>
                    <td className="px-4 py-3 text-center font-bold text-gray-800">{stats.points}</td>
                    <td className={`px-4 py-3 text-center ${getPerformanceColor(stats.performance)}`}>
                      {stats.performance}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HistoricalTable; 