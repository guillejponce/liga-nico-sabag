import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar } from 'lucide-react';
import { pb } from '../config';
import { fetchMatchdays } from '../hooks/admin/matchdayHandlers';
import { fetchMatchesByMatchday } from '../hooks/admin/matchHandlers';
import { fetchAllTeamsOfTheWeek } from '../hooks/admin/teamOfTheWeekHandlers';
import SoccerPitch from '../components/teams/SoccerPitch';
import { fetchSponsors } from '../hooks/admin/sponsorsHandlers';
import backgroundImage from '../assets/images/homepage/landing.jpg';
import { fetchBanners } from '../hooks/admin/bannerHandlers';
import BannerSlider from '../components/layout/bannerslider';

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
        const teams = await fetchAllTeamsOfTheWeek();
        if (teams.length > 0) {
          const latest = teams.reduce((prev, current) => {
            return (prev.expand.matchday.number > current.expand.matchday.number) ? prev : current;
          });
          setLatestTeamOfWeek(latest);
        }

        // Load matchdays and determine the latest phase
        const matchdays = await fetchMatchdays();
        
        // Buscar finales
        const goldFinal = matchdays.find(md => md.phase === 'gold_final');
        const silverFinal = matchdays.find(md => md.phase === 'silver_final');
        
        if (goldFinal || silverFinal) {
          // Si hay finales, mostrar ambas finales
          const finalMatches = [];
          if (goldFinal) {
            const goldMatches = await fetchMatchesByMatchday(goldFinal.id);
            finalMatches.push(...goldMatches.map(match => ({
              ...match,
              phase: goldFinal.phase
            })));
          }
          if (silverFinal) {
            const silverMatches = await fetchMatchesByMatchday(silverFinal.id);
            finalMatches.push(...silverMatches.map(match => ({
              ...match,
              phase: silverFinal.phase
            })));
          }
          setNextMatchday({ ...goldFinal, number: 'Final' });
          setNextMatches(finalMatches);
          return;
        }

        // Buscar semifinales
        const goldSemis = matchdays.find(md => md.phase === 'gold_semi');
        const silverSemis = matchdays.find(md => md.phase === 'silver_semi');

        if (goldSemis || silverSemis) {
          // Si hay semis, mostrar todas las semis
          const semiMatches = [];
          if (goldSemis) {
            const goldMatches = await fetchMatchesByMatchday(goldSemis.id);
            semiMatches.push(...goldMatches);
          }
          if (silverSemis) {
            const silverMatches = await fetchMatchesByMatchday(silverSemis.id);
            semiMatches.push(...silverMatches);
          }
          setNextMatchday({ ...goldSemis, number: 'Semifinal' });
          setNextMatches(semiMatches);
          return;
        }

        // Si no hay playoffs, mostrar la última fecha regular
        const regularMatchdays = matchdays.filter(md => md.phase === 'regular');
        const latestRegular = regularMatchdays.reduce((prev, current) => 
          prev.number > current.number ? prev : current
        );

        if (latestRegular) {
          const matches = await fetchMatchesByMatchday(latestRegular.id);
          setNextMatchday(latestRegular);
          setNextMatches(matches);
        }
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
          description: 'Donde la pasión por el fútbol se une con la competencia amistosa',
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
          description: 'Donde la pasión por el fútbol se une con la competencia amistosa',
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
    if (nextMatchday?.phase === 'regular') {
      return (
        <div className="flex-1 space-y-3 overflow-y-auto">
          {nextMatches.map((match) => (
            <div key={match.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <TeamDisplay team={match.expand?.home_team} />
              <div className="flex-shrink-0 w-16 text-center">
                <span className="text-sm font-bold text-gray-400">VS</span>
              </div>
              <TeamDisplay team={match.expand?.away_team} />
            </div>
          ))}
        </div>
      );
    }

    // Separar partidos por copa
    const goldMatches = nextMatches.filter(match => {
      const phase = match.expand?.matchday?.phase || match.phase;
      return phase?.includes('gold');
    });
    const silverMatches = nextMatches.filter(match => {
      const phase = match.expand?.matchday?.phase || match.phase;
      return phase?.includes('silver');
    });

    return (
      <div className="flex-1 space-y-6 overflow-y-auto">
        {goldMatches.length > 0 && (
          <div>
            <h4 className="text-yellow-600 font-semibold mb-3 flex items-center gap-2">
              <div className="w-3 h-3 bg-yellow-200 rounded-full"></div>
              Copa Oro
            </h4>
            <div className="space-y-3">
              {goldMatches.map((match) => (
                <div key={match.id} className="flex items-center justify-between p-2 bg-yellow-50 rounded">
                  <TeamDisplay team={match.expand?.home_team} />
                  <div className="flex-shrink-0 w-16 text-center">
                    <span className="text-sm font-bold text-gray-400">VS</span>
                  </div>
                  <TeamDisplay team={match.expand?.away_team} />
                </div>
              ))}
            </div>
          </div>
        )}

        {silverMatches.length > 0 && (
          <div>
            <h4 className="text-gray-600 font-semibold mb-3 flex items-center gap-2">
              <div className="w-3 h-3 bg-gray-200 rounded-full"></div>
              Copa Plata
            </h4>
            <div className="space-y-3">
              {silverMatches.map((match) => (
                <div key={match.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <TeamDisplay team={match.expand?.home_team} />
                  <div className="flex-shrink-0 w-16 text-center">
                    <span className="text-sm font-bold text-gray-400">VS</span>
                  </div>
                  <TeamDisplay team={match.expand?.away_team} />
                </div>
              ))}
            </div>
          </div>
        )}
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
              {nextMatchday?.phase === 'gold_final' || nextMatchday?.phase === 'silver_final' 
                ? 'Próximos Partidos' 
                : nextMatchday?.phase === 'gold_semi' || nextMatchday?.phase === 'silver_semi'
                ? 'Próximos Partidos'
                : 'Próxima Fecha'}
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
                      {new Date(nextMatchday.date).toLocaleDateString()}
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

        {/* Quick Access Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4 text-text">Accesos Rápidos</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <Link to="/table" className="bg-accent text-white p-4 rounded text-center hover:bg-accent-dark transition duration-300">Tabla de Posiciones</Link>
            <Link to="/stats" className="bg-accent text-white p-4 rounded text-center hover:bg-accent-dark transition duration-300">Estadísticas</Link>
            <Link to="/teams" className="bg-accent text-white p-4 rounded text-center hover:bg-accent-dark transition duration-300">Equipos</Link>
          </div>
        </section>

        {/* Sponsors Section - at the bottom */}
        <section className="mt-16 mb-8">
          <h2 className="text-2xl font-semibold mb-6 text-center text-text">Nuestros Patrocinadores</h2>
          <div className="flex flex-wrap justify-center gap-12">
            {sponsors.map((sponsor) => {
              console.log('Rendering sponsor:', sponsor);
              return (
                <div key={sponsor.id} className="text-center">
                  <div className="w-32 h-32 mx-auto mb-3 bg-white rounded-lg shadow-md overflow-hidden">
                    {sponsor.logo ? (
                      <img
                        src={pb.getFileUrl(sponsor, sponsor.logo)}
                        alt={sponsor.name}
                        className="w-full h-full object-contain p-2"
                        onError={(e) => {
                          console.error('Image load error:', e);
                          e.target.src = '';
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