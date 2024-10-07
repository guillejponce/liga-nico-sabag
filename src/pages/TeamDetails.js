import React from 'react';
import { useParams } from 'react-router-dom';

const TeamView = () => {
  const { teamId } = useParams();

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-center">Team Details</h1>
      <p className="text-center">Displaying details for team with ID: {teamId}</p>
      {/* Add more team details here */}
    </div>
  );
};

export default TeamView;