import React, { useState } from 'react';

const AdminMatchResultModal = ({ match, teams, onSave, onCancel }) => {
  const initialDateTime = new Date();
  const [homeTeam, setHomeTeam] = useState('');
  const [awayTeam, setAwayTeam] = useState('');
  const [date, setDate] = useState(initialDateTime.toISOString().split('T')[0]);
  const [time, setTime] = useState(initialDateTime.toTimeString().slice(0,5));
  const [homeTeamScore, setHomeTeamScore] = useState(0);
  const [awayTeamScore, setAwayTeamScore] = useState(0);
  const [homePenalties, setHomePenalties] = useState(0);
  const [awayPenalties, setAwayPenalties] = useState(0);

  // Move useEffect before the safety check
  React.useEffect(() => {
    if (match) {
      const matchDateTime = match.date_time ? new Date(match.date_time) : new Date();
      setHomeTeam(match.home_team_id || '');
      setAwayTeam(match.away_team_id || '');
      setDate(matchDateTime.toISOString().split('T')[0]);
      setTime(matchDateTime.toTimeString().slice(0,5));
      setHomeTeamScore(match.home_team_score || 0);
      setAwayTeamScore(match.away_team_score || 0);
      setHomePenalties(match.home_penalties || 0);
      setAwayPenalties(match.away_penalties || 0);
    }
  }, [match]);

  if (!match) {
    console.error('Match object is undefined');
    onCancel?.();
    return null;
  }

  // Show penalty inputs if the scores are equal.
  const showPenalties = Number(homeTeamScore) === Number(awayTeamScore);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Combine date and time into a single ISO string.
    const newDateTime = new Date(`${date}T${time}:00`).toISOString();
    // Prepare the updated data for saving.
    const updatedData = {
      date_time: newDateTime,
      home_team: homeTeam,
      away_team: awayTeam,
      home_team_score: Number(homeTeamScore),
      away_team_score: Number(awayTeamScore),
      is_finished: true, // Mark the match as finished when saving results.
    };
    if (showPenalties) {
      updatedData.home_penalties = Number(homePenalties);
      updatedData.away_penalties = Number(awayPenalties);
    }
    onSave(updatedData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
        <h2 className="text-2xl font-bold mb-4">Edit Match Result</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-700 font-semibold mb-1">Home Team</label>
            <select
              value={homeTeam}
              onChange={(e) => setHomeTeam(e.target.value)}
              className="w-full p-2 border rounded"
            >
              <option value="">Select Home Team</option>
              {teams.map(team => (
                <option key={team.id} value={team.id}>{team.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-gray-700 font-semibold mb-1">Away Team</label>
            <select
              value={awayTeam}
              onChange={(e) => setAwayTeam(e.target.value)}
              className="w-full p-2 border rounded"
            >
              <option value="">Select Away Team</option>
              {teams.map(team => (
                <option key={team.id} value={team.id}>{team.name}</option>
              ))}
            </select>
          </div>
          <div className="flex space-x-4">
            <div className="w-1/2">
              <label className="block text-gray-700 font-semibold mb-1">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full p-2 border rounded"
              />
            </div>
            <div className="w-1/2">
              <label className="block text-gray-700 font-semibold mb-1">Time</label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full p-2 border rounded"
              />
            </div>
          </div>
          <div className="flex space-x-4">
            <div className="w-1/2">
              <label className="block text-gray-700 font-semibold mb-1">Home Score</label>
              <input
                type="number"
                value={homeTeamScore}
                onChange={(e) => setHomeTeamScore(e.target.value)}
                className="w-full p-2 border rounded"
                min="0"
              />
            </div>
            <div className="w-1/2">
              <label className="block text-gray-700 font-semibold mb-1">Away Score</label>
              <input
                type="number"
                value={awayTeamScore}
                onChange={(e) => setAwayTeamScore(e.target.value)}
                className="w-full p-2 border rounded"
                min="0"
              />
            </div>
          </div>
          {showPenalties && (
            <div className="flex space-x-4">
              <div className="w-1/2">
                <label className="block text-gray-700 font-semibold mb-1">Home Penalties</label>
                <input
                  type="number"
                  value={homePenalties}
                  onChange={(e) => setHomePenalties(e.target.value)}
                  className="w-full p-2 border rounded"
                  min="0"
                />
              </div>
              <div className="w-1/2">
                <label className="block text-gray-700 font-semibold mb-1">Away Penalties</label>
                <input
                  type="number"
                  value={awayPenalties}
                  onChange={(e) => setAwayPenalties(e.target.value)}
                  className="w-full p-2 border rounded"
                  min="0"
                />
              </div>
            </div>
          )}
          <div className="flex justify-end space-x-4 mt-6">
            <button type="button" onClick={onCancel} className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded">
              Cancel
            </button>
            <button type="submit" className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded">
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminMatchResultModal;
