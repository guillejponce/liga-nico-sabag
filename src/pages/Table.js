import React from 'react';
import { useTable, useSortBy } from 'react-table';
import { FaSort, FaSortUp, FaSortDown } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useTeams } from '../hooks/teams/useTeams';
import {
  calculateTeamStats,
  updateTeamStatistics,
  getParticipatingTeams,
  getTeamsByPhase,
  getPhasesByStage
} from '../utils/teamsUtils';
import { pb } from '../config';

// Stage options now in Spanish
const stages = [
  { value: 'group_phase', label: 'Fase de Grupos' },
  { value: 'playoffs', label: 'Eliminatorias' },
  { value: 'gold_finals', label: 'Finales de Oro' },
  { value: 'silver_finals', label: 'Finales de Plata' },
  { value: 'bronze_finals', label: 'Finales de Bronce' }
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

const TableView = () => {
  const navigate = useNavigate();
  // Ensure teams is at least an empty array to avoid errors on first render
  const { teams = [], loading, error, refreshTeams } = useTeams();
  const [selectedStage, setSelectedStage] = React.useState('group_phase');
  const [updating, setUpdating] = React.useState(false);
  const [participatingTeams, setParticipatingTeams] = React.useState([]);
  const [teamsByPhase, setTeamsByPhase] = React.useState({});

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
    } catch (err) {
      console.error('Error actualizando estadísticas del equipo:', err);
    } finally {
      setUpdating(false);
    }
  };

  React.useEffect(() => {
    if (teams.length > 0) {
      const phases = getPhasesByStage(selectedStage);
      loadTeamsForPhases(phases);
    }
  }, [selectedStage, teams]);

  // Helper function to safely extract goals from the "GF:GC" string
  const getGoals = (team) => {
    if (!team.goalsForAgainst) return 0;
    const parts = team.goalsForAgainst.split(':');
    return parseInt(parts[0]) || 0;
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

  // A reusable table component for displaying standings
  const TableComponent = ({ data, title }) => {
    const tableInstance = useTable({ columns, data }, useSortBy);
    const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow } = tableInstance;

    return (
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-8">
        <h2 className="text-2xl font-bold p-4 bg-gray-50 text-gray-800 border-b">{title}</h2>
        <div className="overflow-x-auto">
          <table {...getTableProps()} className="w-full">
            <thead>
              {headerGroups.map(headerGroup => (
                <tr {...headerGroup.getHeaderGroupProps()} className="bg-gradient-to-r from-gray-50 to-gray-100">
                  {headerGroup.headers.map(column => (
                    <th {...column.getHeaderProps()} className="px-4 py-2 text-left text-xs font-bold text-gray-600 uppercase tracking-wider border-b border-gray-200">
                      {column.render('Header')}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody {...getTableBodyProps()} className="divide-y divide-gray-100">
              {rows.map(row => {
                prepareRow(row);
                return (
                  <tr
                    {...row.getRowProps()}
                    className="hover:bg-blue-50 cursor-pointer transition-all duration-200"
                    onClick={() => handleRowClick(row.original.id)}
                  >
                    {row.cells.map(cell => (
                      <td {...cell.getCellProps()} className="px-4 py-2 whitespace-nowrap">
                        {cell.render('Cell')}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
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

  // Renders the appropriate tables for the current stage
  const renderTables = () => {
    const phases = getPhasesByStage(selectedStage);
    
    if (selectedStage === 'group_phase') {
      const groupATeams = getTeamsForPhase(teams, teamsByPhase['group_a'] || []);
      const groupBTeams = getTeamsForPhase(teams, teamsByPhase['group_b'] || []);
      return (
        <>
          {groupATeams.length > 0 ? (
            <TableComponent data={groupATeams} title="Grupo A" />
          ) : (
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-8 p-4">
              <h2 className="text-2xl font-bold text-gray-800">Grupo A</h2>
              <p className="text-gray-600 mt-2">No hay partidos programados</p>
            </div>
          )}
          {groupBTeams.length > 0 ? (
            <TableComponent data={groupBTeams} title="Grupo B" />
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
      const goldTeams = getTeamsForPhase(teams, teamsByPhase['gold_group'] || []);
      const silverTeams = getTeamsForPhase(teams, teamsByPhase['silver_group'] || []);
      const bronzeTeams = getTeamsForPhase(teams, teamsByPhase['bronze_group'] || []);
      return (
        <>
          {goldTeams.length > 0 ? (
            <TableComponent data={goldTeams} title="Grupo Oro" />
          ) : (
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-8 p-4">
              <h2 className="text-2xl font-bold text-gray-800">Grupo Oro</h2>
              <p className="text-gray-600 mt-2">No hay partidos programados</p>
            </div>
          )}
          {silverTeams.length > 0 ? (
            <TableComponent data={silverTeams} title="Grupo Plata" />
          ) : (
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-8 p-4">
              <h2 className="text-2xl font-bold text-gray-800">Grupo Plata</h2>
              <p className="text-gray-600 mt-2">No hay partidos programados</p>
            </div>
          )}
          {bronzeTeams.length > 0 ? (
            <TableComponent data={bronzeTeams} title="Grupo Bronce" />
          ) : (
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-8 p-4">
              <h2 className="text-2xl font-bold text-gray-800">Grupo Bronce</h2>
              <p className="text-gray-600 mt-2">No hay partidos programados</p>
            </div>
          )}
        </>
      );
    }

    // For finals stages
    if (selectedStage.includes('finals')) {
      const finalsTeams = getTeamsForPhase(teams, participatingTeams || []);
      const title = stages.find(s => s.value === selectedStage)?.label;
      return finalsTeams.length > 0 ? (
        <TableComponent data={finalsTeams} title={title} />
      ) : (
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-8 p-4">
          <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
          <p className="text-gray-600 mt-2">No hay partidos programados</p>
        </div>
      );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-12 px-4 sm:px-6 lg:px-8">
      {/* Overlay spinner */}
      {updating && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
        </div>
      )}
      
      <div className="max-w-screen-md mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800">Tabla de Posiciones</h1>
          <div className="flex items-center mt-4 md:mt-0">
            <select value={selectedStage} onChange={handleStageChange} className="p-2 border rounded">
              {stages.map(stage => (
                <option key={stage.value} value={stage.value}>
                  {stage.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
      
      {/* Main content container has been narrowed */}
      <div className="max-w-screen-md mx-auto">
        {renderTables()}
      </div>
    </div>
  );
};

export default TableView;
