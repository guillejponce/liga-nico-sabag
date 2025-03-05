import React, { useMemo } from 'react';
import { useTable, useSortBy } from 'react-table';
import { FaSort, FaSortUp, FaSortDown, FaUsers, FaTrophy, FaMedal } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useTeams } from '../hooks/teams/useTeams';
import {
  calculateTeamStats,
  updateTeamStatistics,
  getParticipatingTeams,
  getTeamsByPhase,
  getPhasesByStage
} from '../utils/teamsUtils';
import { getGroupStats } from '../utils/groupUtils';
import { pb } from '../config';

// Stage options now in Spanish
const stages = [
  { value: 'group_phase', label: 'Fase de Grupos 1', icon: FaUsers },
  { value: 'playoffs', label: 'Fase de Grupos 2', icon: FaUsers },
  { value: 'gold_finals', label: 'Finales de Oro', icon: FaMedal },
  { value: 'silver_finals', label: 'Finales de Plata', icon: FaMedal }
];

const columns = [
  {
    Header: 'Pos',
    accessor: 'position',
    Cell: ({ row }) => (
      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-blue-50 to-blue-100 font-bold text-blue-800 shadow-sm">
        {row.index + 1}
      </div>
    ),
  },
  {
    Header: '',
    accessor: 'logo',
    Cell: ({ value }) => (
      <div className="w-12 h-12 p-1 bg-white rounded-full shadow-sm">
        <img 
          src={value} 
          alt="Logo del equipo" 
          className="w-full h-full object-contain rounded-full"
        />
      </div>
    ),
    disableSortBy: true,
  },
  {
    Header: 'Equipo',
    accessor: 'name',
    Cell: ({ value }) => (
      <span className="font-semibold text-gray-800">{value}</span>
    ),
    disableSortBy: true
  },
  {
    Header: 'Pts',
    accessor: 'points',
    Cell: ({ value }) => (
      <div className="font-bold text-blue-800">{value}</div>
    ),
    disableSortBy: true
  },
  {
    Header: 'PJ',
    accessor: 'gamesPlayed',
    Cell: ({ value }) => (
      <span className="text-gray-600">{value}</span>
    ),
    disableSortBy: true
  },
  {
    Header: 'PG',
    accessor: 'won',
    Cell: ({ value }) => (
      <span className="text-gray-600">{value}</span>
    ),
    disableSortBy: true
  },
  {
    Header: 'PE',
    accessor: 'drawn',
    Cell: ({ value }) => (
      <span className="text-gray-600">{value}</span>
    ),
    disableSortBy: true
  },
  {
    Header: 'PP',
    accessor: 'lost',
    Cell: ({ value }) => (
      <span className="text-gray-600">{value}</span>
    ),
    disableSortBy: true
  },
  {
    Header: 'DG',
    accessor: 'goalDifference',
    Cell: ({ value }) => (
      <span className={`font-medium ${value > 0 ? 'text-green-600' : value < 0 ? 'text-red-600' : 'text-gray-600'}`}>
        {value > 0 ? `+${value}` : value}
      </span>
    ),
    disableSortBy: true
  },
  {
    Header: 'GF:GC',
    accessor: 'goalsForAgainst',
    Cell: ({ value }) => (
      <span className="text-gray-600">{value}</span>
    ),
    disableSortBy: true
  },
];

const TableComponent = ({ data, title }) => {
  const columns = useMemo(
    () => [
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
        Header: 'DG',
        accessor: 'goalDifference',
        Cell: ({ value }) => (
          <div className={`text-center font-medium ${value > 0 ? 'text-green-600' : value < 0 ? 'text-red-600' : 'text-gray-600'}`}>
            {value > 0 ? `+${value}` : value}
          </div>
        ),
      },
      {
        Header: 'Pts',
        accessor: 'points',
        Cell: ({ value }) => (
          <div className="text-center font-bold text-blue-800 text-lg">{value}</div>
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
        sortBy: [
          { id: 'points', desc: true },
          { id: 'goalDifference', desc: true },
          { id: 'goalsFor', desc: true },
        ],
      },
    },
    useSortBy
  );

  return (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-8 hover:shadow-2xl transition-shadow duration-300">
      <h2 className="text-2xl font-bold text-gray-800 p-6 bg-gradient-to-r from-gray-50 to-white border-b">{title}</h2>
      <div className="overflow-x-auto">
        <table {...getTableProps()} className="min-w-full">
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
            {rows.map(row => {
              prepareRow(row);
              return (
                <tr {...row.getRowProps()} className="hover:bg-blue-50 transition-colors duration-150">
                  {row.cells.map(cell => {
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
  );
};

const TableView = () => {
  const navigate = useNavigate();
  const { teams = [], loading, error, refreshTeams } = useTeams();
  const [selectedStage, setSelectedStage] = React.useState('group_phase');
  const [updating, setUpdating] = React.useState(false);
  const [participatingTeams, setParticipatingTeams] = React.useState([]);
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

  const loadGroupStats = async () => {
    const stats = {
      group_a: await getGroupStats('group_a_stats'),
      group_b: await getGroupStats('group_b_stats'),
      gold_group: await getGroupStats('gold_group_stats'),
      silver_group: await getGroupStats('silver_group_stats')
    };
    setGroupStats(stats);
  };

  React.useEffect(() => {
    loadGroupStats();
  }, []);

  const handleRowClick = (teamId) => {
    navigate(`/teams/${teamId}`);
  };

  // Called when the user selects a new stage from the dropdown
  const handleStageChange = async (e) => {
    const stage = e.target.value;
    setSelectedStage(stage);
    setUpdating(true);
    try {
      await updateTeamStatistics(stage);
      const phases = getPhasesByStage(stage);
      await loadTeamsForPhases(phases);
      
      if (stage.includes('finals')) {
        const teamIds = await getParticipatingTeams(stage);
        setParticipatingTeams(teamIds);
      } else {
        setParticipatingTeams([]);
      }
      
      if (typeof refreshTeams === 'function') {
        await refreshTeams();
      }

      // Reload group stats if we're in group phase
      if (stage === 'group_phase') {
        await loadGroupStats();
      }
    } catch (err) {
      console.error('Error actualizando estadísticas del equipo:', err);
    } finally {
      setUpdating(false);
    }
  };

  // Helper function to get total goals for sorting
  const getGoals = (team) => {
    return team.goalsFor || 0;
  };

  // Filters teams based on provided team IDs from a phase
  const getTeamsForPhase = (teams, phaseTeamIds) => {
    if (!teams || !phaseTeamIds) return [];
    const filteredTeams = teams.filter(team => phaseTeamIds.includes(team.id));
    return filteredTeams
      .map(team => ({
        id: team.id,
        logo: team.logo ? pb.getFileUrl(team, team.logo) : '',
        name: team.name,
        ...calculateTeamStats(team)
      }))
      .sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
        return getGoals(b) - getGoals(a);
      });
  };

  // Renders the appropriate tables for the current stage
  const renderTables = () => {
    if (selectedStage === 'group_phase') {
      return (
        <>
          {groupStats.group_a.length > 0 ? (
            <TableComponent 
              data={groupStats.group_a.sort((a, b) => {
                if (b.points !== a.points) return b.points - a.points;
                if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
                return getGoals(b) - getGoals(a);
              })} 
              title="Grupo A" 
            />
          ) : (
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-8 p-4">
              <h2 className="text-2xl font-bold text-gray-800">Grupo A</h2>
              <p className="text-gray-600 mt-2">No hay partidos programados</p>
            </div>
          )}
          {groupStats.group_b.length > 0 ? (
            <TableComponent 
              data={groupStats.group_b.sort((a, b) => {
                if (b.points !== a.points) return b.points - a.points;
                if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
                return getGoals(b) - getGoals(a);
              })} 
              title="Grupo B" 
            />
          ) : (
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-8 p-4">
              <h2 className="text-2xl font-bold text-gray-800">Grupo B</h2>
              <p className="text-gray-600 mt-2">No hay partidos programados</p>
            </div>
          )}
        </>
      );
    }

    if (selectedStage === 'playoffs') {
      return (
        <>
          {groupStats.gold_group.length > 0 ? (
            <TableComponent 
              data={groupStats.gold_group.sort((a, b) => {
                if (b.points !== a.points) return b.points - a.points;
                if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
                return getGoals(b) - getGoals(a);
              })} 
              title="Grupo Oro" 
            />
          ) : (
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-8 p-4">
              <h2 className="text-2xl font-bold text-gray-800">Grupo Oro</h2>
              <p className="text-gray-600 mt-2">No hay partidos programados</p>
            </div>
          )}
          {groupStats.silver_group.length > 0 ? (
            <TableComponent 
              data={groupStats.silver_group.sort((a, b) => {
                if (b.points !== a.points) return b.points - a.points;
                if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
                return getGoals(b) - getGoals(a);
              })} 
              title="Grupo Plata" 
            />
          ) : (
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-8 p-4">
              <h2 className="text-2xl font-bold text-gray-800">Grupo Plata</h2>
              <p className="text-gray-600 mt-2">No hay partidos programados</p>
            </div>
          )}
        </>
      );
    }

    // For finals stages
    if (selectedStage.includes('finals')) {
      const title = stages.find(s => s.value === selectedStage)?.label;
      return (
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-8 p-4">
          <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
          <p className="text-gray-600 mt-2">No hay partidos programados</p>
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
              className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 min-w-[200px]
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
        renderTables()
      )}
    </div>
  );
};

export default TableView;
