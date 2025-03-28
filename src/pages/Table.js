import React, { useMemo } from 'react';
import { useTable, useSortBy } from 'react-table';
import { FaUsers } from 'react-icons/fa';
import { useTeams } from '../hooks/teams/useTeams';
import {
  updateTeamStatistics,
  getTeamsByPhase,
  getPhasesByStage
} from '../utils/teamsUtils';
import { getGroupStats } from '../utils/groupUtils';
import { pb } from '../config';

// Stage options now in Spanish
const stages = [
  { value: 'group_phase', label: 'Fase de Grupos 1', icon: FaUsers },
  { value: 'playoffs', label: 'Fase de Grupos 2', icon: FaUsers }
];

const TableComponent = ({ data, title }) => {
  const columns = useMemo(
    () => [
      {
        Header: '#',
        accessor: (row, i) => i + 1,
        Cell: ({ value }) => (
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-blue-50 to-blue-100 font-bold text-blue-800 shadow-sm">
            {value}
          </div>
        ),
        width: 50,
      },
      {
        Header: 'Equipo',
        accessor: 'team.name',
        Cell: ({ row }) => {
          const team = row.original.team;
          if (!team) return null;
          
          return (
            <div className="flex items-center">
              {team.logo && (
                <img 
                  src={team.logo} 
                  alt={team.name} 
                  className="w-10 h-10 mr-3 rounded-full object-cover border-2 border-gray-100 shadow-sm"
                />
              )}
              <span className="font-medium text-gray-900">{team.name}</span>
            </div>
          );
        },
      },
      {
        Header: 'PJ',
        accessor: 'matchesPlayed',
        Cell: ({ value }) => (
          <div className="text-center font-medium text-gray-700">{value}</div>
        ),
      },
      {
        Header: 'Pts',
        accessor: 'points',
        Cell: ({ value }) => (
          <div className="text-center font-bold text-blue-800 text-lg">{value}</div>
        ),
      },
      {
        Header: 'DG',
        accessor: 'goalDifference',
        Cell: ({ value }) => (
          <div className={`text-center font-medium ${value > 0 ? 'text-green-600' : value < 0 ? 'text-red-600' : 'text-gray-600'}`}>
            {value > 0 ? `+${value}` : value}
          </div>
        ),
      },
      {
        Header: 'GF',
        accessor: 'goalsFor',
        Cell: ({ value }) => (
          <div className="text-center font-medium text-blue-600">{value}</div>
        ),
      },
      {
        Header: 'GC',
        accessor: 'goalsAgainst',
        Cell: ({ value }) => (
          <div className="text-center font-medium text-gray-600">{value}</div>
        ),
      },
      {
        Header: 'G',
        accessor: 'wins',
        Cell: ({ value }) => (
          <div className="text-center font-medium text-green-600">{value}</div>
        ),
      },
      {
        Header: 'E',
        accessor: 'draws',
        Cell: ({ value }) => (
          <div className="text-center font-medium text-yellow-600">{value}</div>
        ),
      },
      {
        Header: 'P',
        accessor: 'losses',
        Cell: ({ value }) => (
          <div className="text-center font-medium text-red-600">{value}</div>
        ),
      },
    ],
    []
  );

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow,
  } = useTable(
    {
      columns,
      data,
      initialState: {
        sortBy: []
      },
    },
    useSortBy
  );

  return (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-8 hover:shadow-2xl transition-shadow duration-300">
      <h2 className="text-2xl font-bold text-gray-800 p-6 bg-gradient-to-r from-gray-50 to-white border-b">{title}</h2>
      <div className="w-full overflow-x-auto min-w-0">
        <div className="inline-block min-w-full align-middle">
          <table {...getTableProps()} className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50">
              {headerGroups.map(headerGroup => (
                <tr {...headerGroup.getHeaderGroupProps()}>
                  {headerGroup.headers.map(column => (
                    <th
                      {...column.getHeaderProps(column.getSortByToggleProps())}
                      className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider border-b-2 border-gray-200"
                    >
                      {column.render('Header')}
                      <span>
                        {column.isSorted
                          ? column.isSortedDesc
                            ? ' ↓'
                            : ' ↑'
                          : ''}
                      </span>
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody {...getTableBodyProps()} className="bg-white divide-y divide-gray-100">
              {rows.map((row, index) => {
                prepareRow(row);
                return (
                  <tr {...row.getRowProps()} className="hover:bg-blue-50 transition-colors duration-150">
                    {row.cells.map((cell, cellIndex) => {
                      // If this is the first column (position number)
                      if (cellIndex === 0) {
                        return (
                          <td
                            {...cell.getCellProps()}
                            className="px-6 py-4 whitespace-nowrap"
                          >
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-blue-50 to-blue-100 font-bold text-blue-800 shadow-sm">
                              {index + 1}
                            </div>
                          </td>
                        );
                      }
                      return (
                        <td
                          {...cell.getCellProps()}
                          className="px-6 py-4 whitespace-nowrap"
                        >
                          {cell.render('Cell')}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const TableView = () => {
  const { teams = [], loading, error, refreshTeams } = useTeams();
  const [selectedStage, setSelectedStage] = React.useState('group_phase');
  const [selectedTab, setSelectedTab] = React.useState('group_a');
  const [updating, setUpdating] = React.useState(false);
  const [teamsByPhase, setTeamsByPhase] = React.useState({});
  const [groupStats, setGroupStats] = React.useState({
    group_a: [],
    group_b: [],
    gold_group: [],
    silver_group: []
  });

  // Load teams by phase for the current stage
  const loadTeamsForPhases = async (phases) => {
    try {
      const teamsMap = {};
      for (const phase of phases) {
        const teamIds = await getTeamsByPhase(phase);
        teamsMap[phase] = teamIds;
      }
      setTeamsByPhase(teamsMap);
    } catch (error) {
      console.log('Error al cargar equipos por fase:', error);
      setTeamsByPhase({});
    }
  };

  const loadGroupStats = async (groupName) => {
    try {
      // Cancelar cualquier petición pendiente para este grupo
      pb.cancelRequest(groupName);
      
      const stats = await getGroupStats(groupName);
      setGroupStats(prev => ({
        ...prev,
        [groupName.replace('_stats', '')]: stats
      }));
    } catch (error) {
      // Ignorar errores de cancelación
      if (!error.isAbort && !error.message?.includes('cancelled')) {
        console.error('Error loading group stats:', error);
      }
    }
  };

  // Efecto para cargar estadísticas iniciales
  React.useEffect(() => {
    const statsMap = {
      'group_a': 'group_a_stats',
      'group_b': 'group_b_stats',
      'gold_group': 'gold_group_stats',
      'silver_group': 'silver_group_stats'
    };

    loadGroupStats(statsMap[selectedTab]);

    // Cleanup: cancelar peticiones pendientes
    return () => {
      pb.cancelRequest(statsMap[selectedTab]);
    };
  }, [selectedTab]);

  const renderTable = (data, title) => {
    if (data.length > 0) {
      const sortedData = [...data].sort((a, b) => {
        // Primero por puntos
        if (b.points !== a.points) return b.points - a.points;
        
        // Si los puntos son iguales, por diferencia de gol
        if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
        
        // Si la diferencia de gol es igual, por goles a favor
        return b.goalsFor - a.goalsFor;
      });

      return (
        <TableComponent 
          data={sortedData}
          title={title} 
        />
      );
    }
    return (
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-8 p-4">
        <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
        <p className="text-gray-600 mt-2">No hay partidos programados</p>
      </div>
    );
  };

  const handleTabChange = async (tab) => {
    setSelectedTab(tab);
    setUpdating(true);
    
    const statsMap = {
      'group_a': 'group_a_stats',
      'group_b': 'group_b_stats',
      'gold_group': 'gold_group_stats',
      'silver_group': 'silver_group_stats'
    };

    try {
      await loadGroupStats(statsMap[tab]);
      if (typeof refreshTeams === 'function') {
        await refreshTeams();
      }
    } finally {
      setUpdating(false);
    }
  };

  const handleStageChange = async (e) => {
    const stage = e.target.value;
    setSelectedStage(stage);
    const newTab = stage === 'group_phase' ? 'group_a' : 'gold_group';
    setSelectedTab(newTab);
    setUpdating(true);
    
    try {
      await updateTeamStatistics(stage);
      const phases = getPhasesByStage(stage);
      await loadTeamsForPhases(phases);
      
      const statsMap = {
        'group_a': 'group_a_stats',
        'group_b': 'group_b_stats',
        'gold_group': 'gold_group_stats',
        'silver_group': 'silver_group_stats'
      };
      
      await loadGroupStats(statsMap[newTab]);
      
      if (typeof refreshTeams === 'function') {
        await refreshTeams();
      }
    } catch (err) {
      if (!err.message?.includes('autocancelled') && !err.name?.includes('AbortError')) {
        console.error('Error actualizando estadísticas del equipo:', err);
      }
    } finally {
      setUpdating(false);
    }
  };

  const renderTables = () => {
    if (selectedStage === 'group_phase') {
      return (
        <div>
          <div className="flex mb-6 bg-white rounded-lg shadow-sm p-1">
            <button
              onClick={() => handleTabChange('group_a')}
              className={`flex-1 py-2 px-4 rounded-md transition-colors ${
                selectedTab === 'group_a' 
                  ? 'bg-blue-500 text-white' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Grupo A
            </button>
            <button
              onClick={() => handleTabChange('group_b')}
              className={`flex-1 py-2 px-4 rounded-md transition-colors ${
                selectedTab === 'group_b' 
                  ? 'bg-blue-500 text-white' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Grupo B
            </button>
          </div>
          {selectedTab === 'group_a' && renderTable(groupStats.group_a, 'Grupo A')}
          {selectedTab === 'group_b' && renderTable(groupStats.group_b, 'Grupo B')}
        </div>
      );
    }

    if (selectedStage === 'playoffs') {
      return (
        <div>
          <div className="flex mb-6 bg-white rounded-lg shadow-sm p-1">
            <button
              onClick={() => handleTabChange('gold_group')}
              className={`flex-1 py-2 px-4 rounded-md transition-colors ${
                selectedTab === 'gold_group' 
                  ? 'bg-blue-500 text-white' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Grupo Oro
            </button>
            <button
              onClick={() => handleTabChange('silver_group')}
              className={`flex-1 py-2 px-4 rounded-md transition-colors ${
                selectedTab === 'silver_group' 
                  ? 'bg-blue-500 text-white' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Grupo Plata
            </button>
          </div>
          {selectedTab === 'gold_group' && renderTable(groupStats.gold_group, 'Grupo Oro')}
          {selectedTab === 'silver_group' && renderTable(groupStats.silver_group, 'Grupo Plata')}
        </div>
      );
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-600 p-4">
        Error al cargar los datos de la tabla: {error}
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex flex-wrap gap-2 bg-white rounded-xl p-2 shadow-md">
          {stages.map((stage) => (
            <button
              key={stage.value}
              onClick={() => handleStageChange({ target: { value: stage.value } })}
              disabled={updating}
              className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 min-w-[150px]
                ${selectedStage === stage.value 
                  ? 'bg-blue-500 text-white shadow-md' 
                  : 'text-gray-600 hover:bg-gray-100'}`}
            >
              <stage.icon className={`w-5 h-5 ${selectedStage === stage.value ? 'text-white' : 'text-gray-400'}`} />
              {stage.label}
            </button>
          ))}
        </div>
      </div>

      {updating ? (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="space-y-8 w-full">
          {renderTables()}
        </div>
      )}
    </div>
  );
};

export default TableView;
