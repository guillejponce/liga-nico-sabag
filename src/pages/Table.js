import React from 'react';
import { useTable, useSortBy } from 'react-table';
import { FaSort, FaSortUp, FaSortDown } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useTeams } from '../hooks/teams/useTeams';
import { calculateTeamStats, updateTeamStatistics, getParticipatingTeams, getTeamsByPhase, getPhasesByStage } from '../utils/teamsUtils';
import { pb } from '../config';

const stages = [
  { value: 'group_phase', label: 'Group Phase' },
  { value: 'playoffs', label: 'Playoffs' },
  { value: 'gold_finals', label: 'Gold Finals' },
  { value: 'silver_finals', label: 'Silver Finals' },
  { value: 'bronze_finals', label: 'Bronze Finals' }
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
          alt="Team logo" 
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
  const { teams, loading, error, refreshTeams } = useTeams();
  const [selectedStage, setSelectedStage] = React.useState('group_phase');
  const [updating, setUpdating] = React.useState(false);
  const [participatingTeams, setParticipatingTeams] = React.useState(null);
  const [teamsByPhase, setTeamsByPhase] = React.useState({});

  const loadTeamsForPhases = async (phases) => {
    const teamsMap = {};
    for (const phase of phases) {
      const teamIds = await getTeamsByPhase(phase);
      teamsMap[phase] = teamIds;
    }
    setTeamsByPhase(teamsMap);
  };

  const handleRowClick = (teamId) => {
    navigate(`/teams/${teamId}`);
  };

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
        setParticipatingTeams(null);
      }
      
      if (refreshTeams) {
        await refreshTeams();
      }
    } catch (err) {
      console.error('Error updating team stats:', err);
    } finally {
      setUpdating(false);
    }
  };

  React.useEffect(() => {
    if (selectedStage) {
      const phases = getPhasesByStage(selectedStage);
      loadTeamsForPhases(phases);
    }
  }, [selectedStage]);

  const getTeamsForPhase = (teams, phaseTeamIds) => {
    if (!teams || !phaseTeamIds) return [];
    
    const filteredTeams = teams.filter(team => phaseTeamIds.includes(team.id));
    return filteredTeams.map(team => ({
      id: team.id,
      logo: team.logo ? pb.getFileUrl(team, team.logo) : '',
      name: team.name,
      ...calculateTeamStats(team)
    })).sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
      const aGoals = parseInt(a.goalsForAgainst.split(':')[0]);
      const bGoals = parseInt(b.goalsForAgainst.split(':')[0]);
      return bGoals - aGoals;
    });
  };

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
                    <th {...column.getHeaderProps()} className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider border-b border-gray-200">
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
                      <td {...cell.getCellProps()} className="px-6 py-4 whitespace-nowrap">
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
        Error loading table data: {error}
      </div>
    );
  }

  const renderTables = () => {
    const phases = getPhasesByStage(selectedStage);
    
    if (selectedStage === 'group_phase') {
      return (
        <>
          <TableComponent 
            data={getTeamsForPhase(teams, teamsByPhase['group_a'])} 
            title="Group A"
          />
          <TableComponent 
            data={getTeamsForPhase(teams, teamsByPhase['group_b'])} 
            title="Group B"
          />
        </>
      );
    }

    if (selectedStage === 'playoffs') {
      return (
        <>
          <TableComponent 
            data={getTeamsForPhase(teams, teamsByPhase['gold_group'])} 
            title="Gold Group"
          />
          <TableComponent 
            data={getTeamsForPhase(teams, teamsByPhase['silver_group'])} 
            title="Silver Group"
          />
          <TableComponent 
            data={getTeamsForPhase(teams, teamsByPhase['bronze_group'])} 
            title="Bronze Group"
          />
        </>
      );
    }

    // For finals stages, show single table with participating teams
    if (selectedStage.includes('finals')) {
      return (
        <TableComponent 
          data={getTeamsForPhase(teams, participatingTeams)} 
          title={stages.find(s => s.value === selectedStage)?.label}
        />
      );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-12 px-4 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-bold mb-8 text-center text-gray-800">
        League Table
      </h1>
      <div className="flex justify-center mb-8">
        <select 
          value={selectedStage} 
          onChange={handleStageChange} 
          className="p-2 border rounded"
        >
          {stages.map(stage => (
            <option key={stage.value} value={stage.value}>
              {stage.label}
            </option>
          ))}
        </select>
        {updating && <span className="ml-2 text-blue-500">Updating statistics...</span>}
      </div>
      {renderTables()}
    </div>
  );
};

export default TableView;
