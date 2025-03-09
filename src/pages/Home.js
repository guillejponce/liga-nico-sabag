import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar } from 'lucide-react';
import { pb } from '../config';
import { fetchMatchdays } from '../hooks/admin/matchdayHandlers';
import { fetchLatestTeamOfTheWeek } from '../hooks/admin/teamOfTheWeekHandlers';
import SoccerPitch from '../components/teams/SoccerPitch';
import { fetchSponsors } from '../hooks/admin/sponsorsHandlers';
import backgroundImage from '../assets/images/homepage/landing.jpg';
import { fetchBanners } from '../hooks/admin/bannerHandlers';
import BannerSlider from '../components/layout/bannerslider';
import { fetchCurrentEdition } from '../hooks/admin/editionHandlers';

const PHASE_LABELS = {
  group_a: "Grupo A",
  group_b: "Grupo B",
  gold_group: "Grupo Oro",
  silver_group: "Grupo Plata",
  bronze_group: "Grupo Bronce",
  gold_semi: "Semifinal Oro",
  silver_semi: "Semifinal Plata",
  bronze_semi: "Semifinal Bronce",
  gold_final: "Final Oro",
  silver_final: "Final Plata",
  bronze_final: "Final Bronce",
};

const Home = () => {
  const [latestTeamOfWeek, setLatestTeamOfWeek] = useState(null);
  const [nextMatchday, setNextMatchday] = useState(null);
  const [nextMatches, setNextMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sponsors, setSponsors] = useState([]);
  const [banners, setBanners] = useState([]);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load team of the week
        const latest = await fetchLatestTeamOfTheWeek();
        setLatestTeamOfWeek(latest);

        // First get current edition
        const edition = await fetchCurrentEdition();
        if (!edition) {
          console.log('No current edition found');
          setLoading(false);
          return;
        }

        // Load matchdays and determine the current phase based on the date
        const allMatchdays = await fetchMatchdays();
        // Filter matchdays for current edition
        const matchdays = allMatchdays.filter(md => md.expand?.season?.id === edition.id);

        // Ordenar matchdays por fecha
        const sortedMatchdays = matchdays.sort((a, b) => new Date(a.date_time) - new Date(b.date_time));

        // Encontrar el primer matchday con partidos sin finalizar
        let currentStageMatchday = null;
        let currentStageMatches = [];

        for (const matchday of sortedMatchdays) {
          const matches = await pb.collection('matches').getFullList({
            filter: `matchday="${matchday.id}"`,
            expand: 'home_team,away_team'
          });
          
          const hasUnfinishedMatches = matches.some(match => !match.is_finished);
          
          if (hasUnfinishedMatches) {
            currentStageMatchday = matchday;
            
            // Si estamos en fase de grupos, obtener todos los partidos de la misma jornada
            if (matchday.phase.includes('group_')) {
              const sameRoundMatchdays = matchdays.filter(md => 
                md.number === matchday.number && 
                (md.phase === 'group_a' || md.phase === 'group_b')
              );
              
              let allGroupMatches = [];
              for (const groupMatchday of sameRoundMatchdays) {
                const groupMatches = await pb.collection('matches').getFullList({
                  filter: `matchday="${groupMatchday.id}"`,
                  expand: 'home_team,away_team'
                });
                
                const processedMatches = groupMatches.map(match => ({
                  ...match,
                  phase: groupMatchday.phase,
                  home_team: match.expand?.home_team?.name || '',
                  away_team: match.expand?.away_team?.name || '',
                  home_team_id: match.expand?.home_team?.id || match.home_team,
                  away_team_id: match.expand?.away_team?.id || match.away_team,
                  expand: {
                    home_team: match.expand?.home_team,
                    away_team: match.expand?.away_team
                  }
                }));
                
                allGroupMatches = [...allGroupMatches, ...processedMatches];
              }
              
              currentStageMatches = allGroupMatches;
            } else {
              // Para otras fases, usar solo los partidos del matchday actual
              currentStageMatches = matches.map(match => ({
                ...match,
                phase: matchday.phase,
                home_team: match.expand?.home_team?.name || '',
                away_team: match.expand?.away_team?.name || '',
                home_team_id: match.expand?.home_team?.id || match.home_team,
                away_team_id: match.expand?.away_team?.id || match.away_team,
                expand: {
                  home_team: match.expand?.home_team,
                  away_team: match.expand?.away_team
                }
              }));
            }
            break;
          }
        }

        setNextMatchday(currentStageMatchday);
        setNextMatches(currentStageMatches);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    const loadSponsors = async () => {
      try {
        const sponsorsData = await fetchSponsors();
        console.log('Loaded sponsors:', sponsorsData);
        setSponsors(sponsorsData);
      } catch (error) {
        console.error('Error loading sponsors:', error);
      }
    };

    const loadBanners = async () => {
      try {
        // Get active banners from PocketBase
        const bannersData = await fetchBanners(true);
        
        // Create default banner
        const defaultBanner = {
          id: 'default',
          image: backgroundImage,
          title: 'Bienvenidos a la Liga Nico Sabag',
          description: '📍Canchas Colegio Newland\n 🗓️Lunes (19:45 y 20:45)',
          is_active: true
        };

        // Combine default banner with fetched banners
        setBanners([defaultBanner, ...bannersData]);
      } catch (error) {
        console.error('Error loading banners:', error);
        // If error, at least show default banner
        setBanners([{
          id: 'default',
          image: backgroundImage,
          title: 'Bienvenidos a la Liga Nico Sabag',
          description: '📍Canchas Colegio Newland\n 🗓️Lunes (19:45 y 20:45)',
          is_active: true
        }]);
      }
    };

    loadData();
    loadSponsors();
    loadBanners();
  }, []);

  // Auto-advance banner every 5 seconds
  useEffect(() => {
    if (banners.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentBannerIndex((current) => 
        current === banners.length - 1 ? 0 : current + 1
      );
    }, 5000);

    return () => clearInterval(interval);
  }, [banners.length]);

  const formatTeamOfWeekPlayers = (team) => {
    if (!team) return [];
    return [1, 2, 3, 4, 5, 6, 7].map(num => ({
      position: num,
      firstName: team.expand[`player${num}`]?.first_name || '',
      lastName: team.expand[`player${num}`]?.last_name || '',
      expand: {
        team: {
          id: team.expand[`player${num}`]?.expand?.team?.id,
          name: team.expand[`player${num}`]?.expand?.team?.name,
          logo: team.expand[`player${num}`]?.expand?.team?.logo,
          collectionId: 'teams',
          collectionName: 'teams'
        }
      }
    }));
  };

  const TeamDisplay = ({ team }) => (
    <div className="flex items-center space-x-2">
      <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-100">
        {team?.logo ? (
          <img
            src={pb.getFileUrl(team, team.logo)}
            alt={team.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            {team?.name?.charAt(0)}
          </div>
        )}
      </div>
      <span className="font-medium">{team?.name || 'TBD'}</span>
    </div>
  );

  const nextMatchesDisplay = () => {
    if (!nextMatchday || !nextMatches.length) {
      return (
        <div className="text-center py-4 text-gray-500">
          No hay próximos partidos programados
        </div>
      );
    }

    const renderMatchGroup = (matches, title, bgClass = 'bg-gray-50') => {
      if (!matches || matches.length === 0) return null;
      
      // Tomar solo los primeros 2 partidos
      const displayMatches = matches.slice(0, 2);
      
      return (
        <div className="mb-3">
          <h4 className="text-gray-600 font-semibold mb-2">{title}</h4>
          <div className="space-y-2">
            {displayMatches.map((match) => (
              <div key={match.id} className={`flex items-center justify-between p-2 ${bgClass} rounded`}>
                <div className="flex-1 flex justify-end pr-7">
                  <TeamDisplay team={match.expand?.home_team} />
                </div>
                <div className="flex-shrink-0 flex flex-col items-center justify-center w-20">
                  <div className="text-xs text-gray-500 mb-1">
                    {new Date(match.date_time).toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </div>
                  <span className="text-sm font-bold text-gray-400">VS</span>
                </div>
                <div className="flex-1 flex justify-start pl-7">
                  <TeamDisplay team={match.expand?.away_team} />
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    };

    // Mostrar los partidos según la fase actual
    if (nextMatchday.phase.includes('group_')) {
      const groupAMatches = nextMatches.filter(m => m.phase === 'group_a');
      const groupBMatches = nextMatches.filter(m => m.phase === 'group_b');
      return (
        <div className="flex-1 space-y-4 overflow-y-auto">
          {groupAMatches.length > 0 && renderMatchGroup(groupAMatches, 'Grupo A', 'bg-blue-50')}
          {groupBMatches.length > 0 && renderMatchGroup(groupBMatches, 'Grupo B', 'bg-green-50')}
        </div>
      );
    }

    // Para otras fases, mostrar todos los partidos juntos
    return (
      <div className="flex-1 space-y-4 overflow-y-auto">
        {renderMatchGroup(nextMatches, PHASE_LABELS[nextMatchday.phase], 'bg-gray-50')}
      </div>
    );
  };

  return (
    <div className="bg-body-secondary min-h-screen">
      <BannerSlider 
        banners={banners} 
        currentBannerIndex={currentBannerIndex}
        setCurrentBannerIndex={setCurrentBannerIndex}
      />

      <div className="container mx-auto px-4 py-8">
        {/* Quick Access Section - Moved to top */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4 text-text">Accesos Rápidos</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <Link to="/schedule" className="bg-accent text-white p-4 rounded text-center hover:bg-accent-dark transition duration-300">Resultados</Link>
            <Link to="/table" className="bg-accent text-white p-4 rounded text-center hover:bg-accent-dark transition duration-300">Tabla de Posiciones</Link>
            <Link to="/stats" className="bg-accent text-white p-4 rounded text-center hover:bg-accent-dark transition duration-300">Estadísticas</Link>
            <Link to="/teams" className="bg-accent text-white p-4 rounded text-center hover:bg-accent-dark transition duration-300">Equipos</Link>
          </div>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {/* Team of the Week Section */}
          <section className="h-full">
            <h2 className="text-2xl font-semibold mb-4 text-text">Equipo de la Semana</h2>
            {loading ? (
              <div className="bg-white p-4 rounded-lg shadow animate-pulse h-[450px]">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            ) : latestTeamOfWeek ? (
              <div className="bg-white rounded-xl overflow-hidden shadow-lg h-[450px] flex flex-col">
                <div className="bg-gradient-to-r from-green-600 to-green-700 p-3">
                  <h3 className="text-lg font-semibold text-white text-center">
                    Jornada {latestTeamOfWeek.expand.matchday.number}
                  </h3>
                </div>
                <div className="flex-1 p-3 flex flex-col">
                  <div className="flex-1 relative">
                    <SoccerPitch
                      formation={latestTeamOfWeek.formation}
                      players={formatTeamOfWeekPlayers(latestTeamOfWeek)}
                      expanded={true}
                      compact={true}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white p-4 rounded-lg shadow text-center text-gray-500 h-[450px] flex items-center justify-center">
                No hay equipo de la semana disponible
              </div>
            )}
          </section>

          {/* Next Fixtures Section */}
          <section className="h-full">
            <h2 className="text-2xl font-semibold mb-4 text-text">
              {nextMatchday?.phase?.includes('final') ? 'Finales' :
               nextMatchday?.phase?.includes('semi') ? 'Semifinales' :
               nextMatchday?.phase?.includes('group') ? 'Fase de Grupos' :
               'Próxima Fecha'}
            </h2>
            {loading ? (
              <div className="bg-white p-4 rounded-lg shadow animate-pulse h-[450px]">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            ) : nextMatchday ? (
              <div className="bg-white rounded-xl overflow-hidden shadow-lg h-[450px] flex flex-col">
                <div className="bg-gradient-to-r from-green-600 to-green-700 p-3">
                  <div className="flex items-center justify-between text-white">
                    <h3 className="text-lg font-semibold">Jornada {nextMatchday.number}</h3>
                    <div className="flex items-center text-sm">
                      <Calendar className="w-4 h-4 mr-2" />
                      {new Date(nextMatchday.date_time).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <div className="flex-1 p-3 flex flex-col">
                  {nextMatchesDisplay()}
                  <div className="pt-3 mt-3 border-t text-right">
                    <Link to="/schedule" className="text-accent hover:text-accent-dark text-sm font-medium">
                      Ver calendario completo →
                    </Link>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white p-4 rounded-lg shadow text-center text-gray-500 h-[450px] flex items-center justify-center">
                No hay próximos partidos programados
              </div>
            )}
          </section>
        </div>

        {/* Sponsors Section */}
        <section className="mt-16 mb-8">
          <h2 className="text-2xl font-semibold mb-6 text-center text-text">Nuestros Patrocinadores</h2>
          <div className="flex flex-wrap justify-center gap-12">
            {sponsors.map((sponsor) => {
              console.log('Rendering sponsor:', sponsor);
              return (
                <div key={sponsor.id} className="text-center">
                  <div className="w-32 h-32 mx-auto mb-3 bg-white rounded-lg shadow-md overflow-hidden">
                    {sponsor.image ? (
                      <img
                        src={pb.getFileUrl(sponsor, sponsor.image)}
                        alt={sponsor.name}
                        className="w-full h-full object-contain p-2"
                        onError={(e) => {
                          console.error('Image load error:', e);
                          e.target.src = 'https://via.placeholder.com/128?text=' + encodeURIComponent(sponsor.name);
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
                        {sponsor.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <p className="text-text-dark font-medium">{sponsor.name}</p>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Home;