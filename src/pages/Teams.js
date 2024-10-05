import React from 'react';
import { Link } from 'react-router-dom';

// This is a mock data array. In a real application, you'd fetch this data from an API.
const teamsData = [
  { id: 1, name: 'Team A' },
  { id: 2, name: 'Team B' },
  { id: 3, name: 'Team C' },
  // Add more teams as needed
];

const Teams = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Teams</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {teamsData.map((team) => (
          <Link
            key={team.id}
            to={`/teams/${team.id}`}
            className="bg-white shadow-md rounded-lg p-4 hover:shadow-lg transition duration-300"
          >
            <h2 className="text-xl font-semibold">{team.name}</h2>
            {/* Add more team information here if needed */}
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Teams;