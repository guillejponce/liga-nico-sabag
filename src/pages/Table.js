import React from 'react';
import { useTable, useSortBy } from 'react-table';
import { FaSort, FaSortUp, FaSortDown } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { mockTableData } from '../constants/Mock_table';

const mockData = mockTableData
const columns = [
  {
    Header: '',
    accessor: 'logo',
    Cell: ({ value }) => <img src={value} alt="Team logo" className="w-8 h-8" />,
    disableSortBy: true,
  },
  {
    Header: 'Team',
    accessor: 'name',
  },
  {
    Header: 'Points',
    accessor: 'points',
  },
  {
    Header: 'Goal Difference',
    accessor: 'goalDifference',
  },
  {
    Header: 'Games Played',
    accessor: 'gamesPlayed',
  },
  {
    Header: 'Goals For:Against',
    accessor: 'goalsForAgainst',
  },
];

const TableView = () => {
  const navigate = useNavigate();

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow,
  } = useTable({ columns, data: mockData }, useSortBy);

  const handleRowClick = (teamId) => {
    navigate(`/teams/${teamId}`);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-center">League Table</h1>
      <div className="overflow-x-auto">
        <table {...getTableProps()} className="w-full bg-white shadow-md rounded-lg overflow-hidden">
          <thead className="bg-gray-200">
            {headerGroups.map(headerGroup => (
              <tr {...headerGroup.getHeaderGroupProps()}>
                {headerGroup.headers.map(column => (
                  <th
                    {...column.getHeaderProps(column.getSortByToggleProps())}
                    className="px-4 py-2 text-left font-semibold text-gray-600 uppercase tracking-wider"
                  >
                    {column.render('Header')}
                    <span className="ml-2">
                      {column.isSorted ? (
                        column.isSortedDesc ? (
                          <FaSortDown className="inline" />
                        ) : (
                          <FaSortUp className="inline" />
                        )
                      ) : (
                        <FaSort className="inline" />
                      )}
                    </span>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody {...getTableBodyProps()}>
            {rows.map(row => {
              prepareRow(row);
              return (
                <tr 
                  {...row.getRowProps()} 
                  className="hover:bg-gray-50 cursor-pointer transition duration-150 ease-in-out"
                  onClick={() => handleRowClick(row.original.id)}
                >
                  {row.cells.map(cell => (
                    <td {...cell.getCellProps()} className="px-4 py-2 border-t">
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

export default TableView;