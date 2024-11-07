import React from 'react';
import { useTable, useSortBy } from 'react-table';
import { FaSort, FaSortUp, FaSortDown } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useTeams } from '../hooks/teams/useTeams';
import { calculateTeamStats } from '../utils/teamsUtils';
import { pb } from '../config';

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
  const { teams, loading, error } = useTeams();

  const handleRowClick = (teamId) => {
    navigate(`/teams/${teamId}`);
  };

  const data = React.useMemo(() => {
    if (!teams) return [];
    
    return teams.map(team => {
      const stats = calculateTeamStats(team);
      return {
        id: team.id,
        logo: team.logo ? pb.getFileUrl(team, team.logo) : '',
        name: team.name,
        ...stats
      };
    }).sort((a, b) => {
      // Sort by points first
      if (b.points !== a.points) return b.points - a.points;
      // If points are equal, sort by goal difference
      if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
      // If goal difference is equal, sort by goals scored
      return parseInt(b.goalsForAgainst) - parseInt(a.goalsForAgainst);
    });
  }, [teams]);

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow,
  } = useTable({ columns, data }, useSortBy);

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-center text-gray-800">
          Tabla de Posiciones
          <div className="mt-2 text-sm font-normal text-gray-500">Temporada 2023/24</div>
        </h1>
        
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table {...getTableProps()} className="w-full">
              <thead>
                {headerGroups.map(headerGroup => (
                  <tr {...headerGroup.getHeaderGroupProps()} className="bg-gradient-to-r from-gray-50 to-gray-100">
                    {headerGroup.headers.map(column => (
                      <th
                        {...column.getHeaderProps(column.getSortByToggleProps())}
                        className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider border-b border-gray-200"
                      >
                        <div className="flex items-center space-x-1">
                          <span>{column.render('Header')}</span>
                          {column.canSort && (
                            <span className="text-gray-400">
                              {column.isSorted ? (
                                column.isSortedDesc ? (
                                  <FaSortDown className="text-blue-500" />
                                ) : (
                                  <FaSortUp className="text-blue-500" />
                                )
                              ) : (
                                <FaSort className="opacity-50" />
                              )}
                            </span>
                          )}
                        </div>
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody {...getTableBodyProps()} className="divide-y divide-gray-100">
                {rows.map((row, i) => {
                  prepareRow(row);
                  return (
                    <tr 
                      {...row.getRowProps()} 
                      className={`
                        hover:bg-blue-50 cursor-pointer transition-all duration-200
                        ${i < 4 ? 'bg-gradient-to-r from-amber-50/80 to-amber-100/30 hover:from-amber-100/80 hover:to-amber-200/30' : ''}
                        ${i >= 4 && i < 8 ? 'bg-gradient-to-r from-gray-50 to-gray-100/50 hover:from-gray-100 hover:to-gray-200/50' : ''}
                        ${i === 3 ? 'border-b-2 border-amber-200/50' : ''}
                        ${i === 7 ? 'border-b-2 border-gray-200' : ''}
                      `}
                      onClick={() => handleRowClick(row.original.id)}
                    >
                      {row.cells.map((cell, cellIndex) => (
                        <td 
                          {...cell.getCellProps()} 
                          className={`px-6 py-4 whitespace-nowrap ${cellIndex === 0 && i < 4 ? 'relative' : ''}`}
                        >
                          {cellIndex === 0 && i < 4 && (
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-300/70"></div>
                          )}
                          {cellIndex === 0 && i >= 4 && i < 8 && (
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gray-400"></div>
                          )}
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
        
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-2 gap-4 max-w-2xl mx-auto text-sm">
          <div className="bg-gradient-to-r from-amber-50/80 to-amber-100/30 p-4 rounded-lg shadow-sm">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-amber-300/70 rounded"></div>
              <span className="font-semibold text-gray-800">Clasificación Copa Oro (Posiciones 1-4)</span>
            </div>
          </div>
          <div className="bg-gradient-to-r from-gray-50 to-gray-100/50 p-4 rounded-lg shadow-sm">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-gray-400 rounded"></div>
              <span className="font-semibold text-gray-800">Clasificación Copa Plata (Posiciones 5-8)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TableView;