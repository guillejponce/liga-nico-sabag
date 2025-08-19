import React, { useState, useEffect } from 'react';
import { Loader2, Star } from 'lucide-react';
import { pb } from '../config';

const HistoricalScorers = () => {
  const [scorers, setScorers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [teamFilter, setTeamFilter] = useState('');
  const [abortController] = useState(new AbortController());

  useEffect(() => {
    const loadScorers = async () => {
      try {
        setLoading(true);
        setError(null);

        const events = await pb.collection('events').getFullList({
          filter: 'type = "goal"',
          expand: 'player.team',
          $cancelKey: 'historical-goals',
          signal: abortController.signal,
        });

        const scorerMap = {};
        events.forEach((ev) => {
          const p = ev.expand?.player;
          if (!p) return;
          if (!scorerMap[p.id]) {
            scorerMap[p.id] = { count: 0, player: p };
          }
          scorerMap[p.id].count += 1;
        });

        const arr = Object.values(scorerMap).sort((a, b) => b.count - a.count);
        setScorers(arr);
        // set default team options later
      } catch (err) {
        if (!err.message?.includes('autocancelled')) {
          console.error('Error loading historical scorers:', err);
          setError('Error al cargar la tabla de goleadores.');
        }
      } finally {
        setLoading(false);
      }
    };

    loadScorers();

    return () => abortController.abort();
  }, [abortController]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <span className="ml-2 text-lg">Cargando goleadores...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen text-red-600 font-semibold">
        {error}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center space-x-3 mb-6">
          <Star className="w-8 h-8 text-yellow-400" />
          <h1 className="text-3xl font-bold text-blue-900">Tabla Histórica de Goleadores</h1>
        </div>

        <div className="bg-yellow-100 text-yellow-900 p-4 rounded-lg mb-6 text-sm">
          Nota: Pueden faltar datos de la primera edición, por lo que no está completa la tabla.
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <input
            type="text"
            placeholder="Buscar jugador..."
            value={searchTerm}
            onChange={(e)=>setSearchTerm(e.target.value)}
            className="px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500"
          />
          <select
            value={teamFilter}
            onChange={(e)=>setTeamFilter(e.target.value)}
            className="px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            <option value="">Todos los equipos</option>
            {Array.from(new Set(scorers.map(s=>s.player.expand?.team?.name).filter(Boolean))).sort().map(teamName=> (
              <option key={teamName} value={teamName}>{teamName}</option>
            ))}
          </select>
        </div>

        <div className="bg-white rounded-lg shadow-xl overflow-hidden ring-1 ring-gray-200">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white">
                  <th className="px-4 py-3 text-left">Pos</th>
                  <th className="px-4 py-3 text-left">Jugador</th>
                  <th className="px-4 py-3 text-left">Equipo</th>
                  <th className="px-4 py-3 text-right">Goles</th>
                </tr>
              </thead>
              <tbody>
                {scorers
                  .filter(s=>{
                    const matchesSearch = `${s.player.first_name} ${s.player.last_name}`.toLowerCase().includes(searchTerm.toLowerCase());
                    const matchesTeam = teamFilter ? (s.player.expand?.team?.name === teamFilter) : true;
                    return matchesSearch && matchesTeam;
                  })
                  .map((s, idx) => (
                  <tr key={s.player.id} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-yellow-50 transition-colors`}>
                    <td className={`px-4 py-3 font-semibold text-center ${idx===0?'text-amber-600':idx===1?'text-gray-500':idx===2?'text-amber-900':'text-gray-700'}`}>{idx + 1}</td>
                    <td className="px-4 py-3 text-gray-800 flex items-center gap-2">
                      {s.player.expand?.team?.logo && (
                        <img
                          src={pb.getFileUrl(s.player.expand.team, s.player.expand.team.logo)}
                          alt={s.player.expand.team.name}
                          className="w-6 h-6 rounded-full border"
                        />
                      )}
                      <span>{s.player.first_name} {s.player.last_name}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {s.player.expand?.team?.name || '—'}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-gray-800">{s.count}</td>
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

export default HistoricalScorers;
