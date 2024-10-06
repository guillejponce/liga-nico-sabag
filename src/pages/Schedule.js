import React, { useState } from 'react';
import { Calendar, Clock } from 'lucide-react';
import { teamsData } from '../constants/Mocks';

// Helper function to generate mock schedule
const generateMockSchedule = () => {
  const schedule = [];
  const matchdays = 13; // Each team plays against every other team once

  for (let matchday = 1; matchday <= matchdays; matchday++) {
    const matches = [];
    const availableTeams = [...teamsData];

    while (availableTeams.length > 1) {
      const homeTeam = availableTeams.splice(Math.floor(Math.random() * availableTeams.length), 1)[0];
      const awayTeam = availableTeams.splice(Math.floor(Math.random() * availableTeams.length), 1)[0];
      
      matches.push({
        id: `${matchday}-${homeTeam.id}-${awayTeam.id}`,
        homeTeam,
        awayTeam,
        date: `2024-${matchday < 10 ? '0' + matchday : matchday}-01`, // Mock date
        time: '20:00', // Mock time
      });
    }

    schedule.push({ matchday, matches });
  }

  return schedule;
};

const mockSchedule = generateMockSchedule();

const Schedule = () => {
  const [activeMatchday, setActiveMatchday] = useState(1);

  return (
    <div className="bg-body min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6 text-text">Calendario de la Liga</h1>
        
        {/* Matchday tabs */}
        <div className="flex flex-wrap mb-6">
          {mockSchedule.map(({ matchday }) => (
            <button
              key={matchday}
              onClick={() => setActiveMatchday(matchday)}
              className={`px-4 py-2 mr-2 mb-2 rounded-md transition-colors ${
                activeMatchday === matchday
                  ? 'bg-accent text-white'
                  : 'bg-body-secondary text-text hover:bg-accent-light'
              }`}
            >
              Jornada {matchday}
            </button>
          ))}
        </div>

        {/* Matches for the selected matchday */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {mockSchedule
            .find(({ matchday }) => matchday === activeMatchday)
            .matches.map((match) => (
              <div key={match.id} className="bg-body-secondary rounded-lg p-6 shadow-md">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center text-text-dark">
                    <Calendar size={18} className="mr-2" />
                    <span>{match.date}</span>
                  </div>
                  <div className="flex items-center text-text-dark">
                    <Clock size={18} className="mr-2" />
                    <span>{match.time}</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <div className="text-center w-5/12">
                    <h3 className="font-semibold text-text">{match.homeTeam.name}</h3>
                    <p className="text-sm text-text-dark">Local</p>
                  </div>
                  <div className="text-2xl font-bold text-accent">VS</div>
                  <div className="text-center w-5/12">
                    <h3 className="font-semibold text-text">{match.awayTeam.name}</h3>
                    <p className="text-sm text-text-dark">Visitante</p>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default Schedule;