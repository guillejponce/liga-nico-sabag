import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar } from 'lucide-react';
import { useSwipeable } from 'react-swipeable';
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
  const [sponsorsLoading, setSponsorsLoading] = useState(true);
  const [banners, setBanners] = useState([]);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [isPaused] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [matchesPerSlide] = useState(3);

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
        console.log('Total matchdays para la edición actual:', matchdays.length);
        console.log('Fases disponibles:', [...new Set(matchdays.map(md => md.phase))]);

        // Ordenar matchdays por fecha
        const sortedMatchdays = matchdays.sort((a, b) => new Date(a.date_time) - new Date(b.date_time));
        
        // Encontrar el primer matchday FUTURO
        const currentDate = new Date();
        const upcomingMatchdays = sortedMatchdays.filter(md => new Date(md.date_time) >= currentDate);
        
        let currentStageMatchday = null;
        let currentStageMatches = [];
        
        // Buscar primero en las fechas futuras
        if (upcomingMatchdays.length > 0) {
          currentStageMatchday = upcomingMatchdays[0]; // El próximo matchday
          const matches = await pb.collection('matches').getFullList({
            filter: `matchday="${currentStageMatchday.id}"`,
            expand: 'home_team,away_team'
          });
          
          // Si estamos en fase de grupos oro o plata
          if (currentStageMatchday.phase === 'gold_group' || currentStageMatchday.phase === 'silver_group') {
            // Buscar los matchdays específicos para ambos grupos
            const goldMatchdays = matchdays.filter(md => 
              md.phase === 'gold_group' && md.number === currentStageMatchday.number
            );
            const silverMatchdays = matchdays.filter(md => 
              md.phase === 'silver_group' && md.number === currentStageMatchday.number
            );
            
            let allMatches = [];
            
            // Cargar partidos del grupo ORO
            for (const goldMatchday of goldMatchdays) {
              const goldMatches = await pb.collection('matches').getFullList({
                filter: `matchday="${goldMatchday.id}"`,
                expand: 'home_team,away_team'
              });
              
              const processedGoldMatches = goldMatches.map(match => ({
                ...match,
                phase: 'gold_group',
                home_team: match.expand?.home_team?.name || '',
                away_team: match.expand?.away_team?.name || '',
                home_team_id: match.expand?.home_team?.id || match.home_team,
                away_team_id: match.expand?.away_team?.id || match.away_team,
                expand: {
                  home_team: match.expand?.home_team,
                  away_team: match.expand?.away_team
                }
              }));
              
              allMatches = [...allMatches, ...processedGoldMatches];
            }
            
            // Cargar partidos del grupo PLATA 
            for (const silverMatchday of silverMatchdays) {
              const silverMatches = await pb.collection('matches').getFullList({
                filter: `matchday="${silverMatchday.id}"`,
                expand: 'home_team,away_team'
              });
              
              const processedSilverMatches = silverMatches.map(match => ({
                ...match,
                phase: 'silver_group',
                home_team: match.expand?.home_team?.name || '',
                away_team: match.expand?.away_team?.name || '',
                home_team_id: match.expand?.home_team?.id || match.home_team,
                away_team_id: match.expand?.away_team?.id || match.away_team,
                expand: {
                  home_team: match.expand?.home_team,
                  away_team: match.expand?.away_team
                }
              }));
              
              allMatches = [...allMatches, ...processedSilverMatches];
            }
            
            currentStageMatches = allMatches;
          }
          // Caso grupos A y B
          else if (currentStageMatchday.phase === 'group_a' || currentStageMatchday.phase === 'group_b') {
            const sameRoundMatchdays = matchdays.filter(md => 
              md.number === currentStageMatchday.number && 
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
          }
          // Otras fases (semifinales, finales, etc.)
          else {
            // Para otras fases, usar solo los partidos del matchday actual
            currentStageMatches = matches.map(match => ({
              ...match,
              phase: currentStageMatchday.phase,
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
        }
        // Si no hay fechas futuras, usar la última fecha jugada
        else if (sortedMatchdays.length > 0) {
          const latestMatchday = sortedMatchdays[sortedMatchdays.length - 1];
          currentStageMatchday = latestMatchday;
          
          // Procesar según el tipo de fase como antes...
          // (el código es similar a la sección anterior)
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
        setSponsorsLoading(true);
        const sponsorsData = await fetchSponsors();
        // Eliminar duplicados basados en el ID
        const uniqueSponsors = Array.from(new Map(sponsorsData.map(s => [s.id, s])).values());
        setSponsors(uniqueSponsors);
      } catch (error) {
        console.error('Error loading sponsors:', error);
        setSponsors([]);
      } finally {
        setSponsorsLoading(false);
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
          description: '📍Canchas Colegio Newland\n 🗓️Lunes (20:00 y 21:00)',
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

  // Auto-scroll para sponsors
  useEffect(() => {
    if (sponsors.length <= 2 || sponsorsLoading || isPaused) return;

    const interval = setInterval(() => {
      const container = document.getElementById('sponsors-container');
      if (container) {
        if (container.scrollLeft >= (container.scrollWidth - container.clientWidth)) {
          container.scrollLeft = 0;
        } else {
          container.scrollLeft += 200;
        }
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [sponsors.length, sponsorsLoading, isPaused]);

  const handleSlideChange = (direction) => {
    // Determinar qué fase se está mostrando
    const isInitialGroups = nextMatchday?.phase?.includes('group_a') || nextMatchday?.phase?.includes('group_b');
    const isSecondPhaseGroups = nextMatchday?.phase?.includes('gold_group') || nextMatchday?.phase?.includes('silver_group');
    
    let totalSlides = 0;
    
    if (isInitialGroups) {
      const groupAMatches = nextMatches.filter(m => m.phase === 'group_a');
      const groupBMatches = nextMatches.filter(m => m.phase === 'group_b');
      const totalSlidesA = Math.ceil(groupAMatches.length / matchesPerSlide);
      const totalSlidesB = Math.ceil(groupBMatches.length / matchesPerSlide);
      totalSlides = totalSlidesA + totalSlidesB;
    }
    else if (isSecondPhaseGroups) {
      // Verificación explicita de los partidos
      const goldGroupMatches = nextMatches.filter(m => m.phase === 'gold_group');
      const silverGroupMatches = nextMatches.filter(m => m.phase === 'silver_group');
      
      console.log('=== DETALLE DE PARTIDOS EN NEXTMATCHESDISPLAY ===');
      console.log('Partidos disponibles por fase:');
      console.log('- Oro:', goldGroupMatches.length, goldGroupMatches.map(m => `${m.home_team} vs ${m.away_team}`));
      console.log('- Plata:', silverGroupMatches.length, silverGroupMatches.map(m => `${m.home_team} vs ${m.away_team}`));
      
      // Verificar si tenemos partidos para ambos grupos
      const hasGoldMatches = goldGroupMatches.length > 0;
      const hasSilverMatches = silverGroupMatches.length > 0;
      
      console.log('Tiene partidos de Oro:', hasGoldMatches);
      console.log('Tiene partidos de Plata:', hasSilverMatches);
      
      // Si no hay partidos de plata pero se intenta mostrar la sección de plata
      const showingGoldTab = currentSlide < Math.max(1, Math.ceil(goldGroupMatches.length / matchesPerSlide));
      const wantsSilverButNoMatches = !showingGoldTab && !hasSilverMatches;
      
      console.log('Quiere mostrar plata pero no hay partidos:', wantsSilverButNoMatches);
      
      // Calcular slides
      const totalSlidesGold = Math.max(1, Math.ceil(goldGroupMatches.length / matchesPerSlide));
      const totalSlidesSilver = Math.max(1, Math.ceil(silverGroupMatches.length / matchesPerSlide));
      
      console.log('Cantidad de slides: Oro =', totalSlidesGold, ', Plata =', totalSlidesSilver);
      console.log('Slide actual:', currentSlide);
      
      // Acotar el slide actual al rango permitido
      let effectiveSlide = currentSlide;
      const totalSlides = totalSlidesGold + totalSlidesSilver;
      if (effectiveSlide >= totalSlides) {
        effectiveSlide = 0; // Resetear a la primera slide si estamos fuera de rango
        setCurrentSlide(0);
      }
      
      // Determinar qué grupo mostrar basado en el slide actual
      const isGoldGroup = effectiveSlide < totalSlidesGold;
      
      console.log('Slider efectivo:', effectiveSlide, 'Mostrando grupo:', isGoldGroup ? 'Oro' : 'Plata');
      
      return (
        <div className="flex-1 flex flex-col" {...swipeHandlers}>
          <div className="transition-all duration-500 ease-in-out">
            {isGoldGroup ? (
              // Mostrar partidos de Oro
              renderMatchGroup(goldGroupMatches, 'Grupo Oro', 'bg-yellow-50', effectiveSlide)
            ) : (
              // Mostrar partidos de Plata (o mensaje si no hay partidos)
              hasSilverMatches ? (
                renderMatchGroup(silverGroupMatches, 'Grupo Plata', 'bg-gray-50', effectiveSlide - totalSlidesGold)
              ) : (
                <div className="mb-3">
                  <h4 className="text-gray-600 font-semibold mb-2">Grupo Plata</h4>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-center text-gray-500">No hay partidos disponibles para el grupo Plata</p>
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      );
    }
    else {
      totalSlides = Math.ceil(nextMatches.length / matchesPerSlide);
    }

    if (direction === 'next') {
      setCurrentSlide(prev => (prev + 1) % totalSlides);
    } else {
      setCurrentSlide(prev => (prev - 1 + totalSlides) % totalSlides);
    }
  };

  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => handleSlideChange('next'),
    onSwipedRight: () => handleSlideChange('prev'),
    preventDefaultTouchmoveEvent: true,
    trackMouse: true
  });

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
      <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
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
      <span className="font-medium text-sm sm:text-base truncate max-w-[100px] sm:max-w-[140px]">{team?.name || 'TBD'}</span>
    </div>
  );

  const renderMatchGroup = (matches, title, bgClass = 'bg-gray-50', slideIndex) => {
    if (!matches || matches.length === 0) {
      console.log(`No hay partidos para mostrar en ${title}`);
      return null;
    }
    
    const startIndex = slideIndex * matchesPerSlide;
    const visibleMatches = matches.slice(startIndex, startIndex + matchesPerSlide);
    
    console.log(`Renderizando ${visibleMatches.length} partidos para ${title}`, 
      visibleMatches.map(m => `${m.home_team} vs ${m.away_team}`));
    
    return (
      <div className="mb-3">
        <h4 className="text-gray-600 font-semibold mb-2">{title}</h4>
        <div className="space-y-3">
          {visibleMatches.map((match) => (
            <div key={match.id} className={`flex flex-col sm:flex-row items-center p-3 ${bgClass} rounded gap-3`}>
              <div className="w-full sm:w-[45%] flex justify-center sm:justify-end">
                <TeamDisplay team={match.expand?.home_team} />
              </div>
              <div className="flex flex-col items-center justify-center min-w-[80px]">
                <div className="text-xs text-gray-500 mb-1">
                  {new Date(match.date_time).toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </div>
                <span className="text-sm font-bold text-gray-400">VS</span>
              </div>
              <div className="w-full sm:w-[45%] flex justify-center sm:justify-start">
                <TeamDisplay team={match.expand?.away_team} />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const nextMatchesDisplay = () => {
    if (!nextMatchday || !nextMatches.length) {
      return (
        <div className="text-center py-4 text-gray-500">
          No hay próximos partidos programados
        </div>
      );
    }

    // Mostrar los partidos según la fase actual
    if (nextMatchday.phase.includes('group_')) {
      // Determinar qué grupos se están mostrando según la fase
      const isInitialGroups = nextMatchday.phase.includes('group_a') || nextMatchday.phase.includes('group_b');
      const isSecondPhaseGroups = nextMatchday.phase.includes('gold_group') || nextMatchday.phase.includes('silver_group');
      
      if (isInitialGroups) {
        const groupAMatches = nextMatches.filter(m => m.phase === 'group_a');
        const groupBMatches = nextMatches.filter(m => m.phase === 'group_b');
        
        const totalSlidesA = Math.ceil(groupAMatches.length / matchesPerSlide);
        const totalSlidesB = Math.ceil(groupBMatches.length / matchesPerSlide);
        
        // Determinar qué grupo mostrar basado en el slide actual
        const isGroupA = currentSlide < totalSlidesA;
        
        return (
          <div className="flex-1 flex flex-col" {...swipeHandlers}>
            <div className="transition-all duration-500 ease-in-out">
              {isGroupA ? (
                renderMatchGroup(groupAMatches, 'Grupo A', 'bg-blue-50', currentSlide)
              ) : (
                renderMatchGroup(groupBMatches, 'Grupo B', 'bg-green-50', currentSlide - totalSlidesA)
              )}
            </div>
          </div>
        );
      } 
      else if (isSecondPhaseGroups) {
        // Verificación explicita de los partidos
        const goldGroupMatches = nextMatches.filter(m => m.phase === 'gold_group');
        const silverGroupMatches = nextMatches.filter(m => m.phase === 'silver_group');
        
        console.log('=== DETALLE DE PARTIDOS EN NEXTMATCHESDISPLAY ===');
        console.log('Partidos disponibles por fase:');
        console.log('- Oro:', goldGroupMatches.length, goldGroupMatches.map(m => `${m.home_team} vs ${m.away_team}`));
        console.log('- Plata:', silverGroupMatches.length, silverGroupMatches.map(m => `${m.home_team} vs ${m.away_team}`));
        
        // Verificar si tenemos partidos para ambos grupos
        const hasGoldMatches = goldGroupMatches.length > 0;
        const hasSilverMatches = silverGroupMatches.length > 0;
        
        console.log('Tiene partidos de Oro:', hasGoldMatches);
        console.log('Tiene partidos de Plata:', hasSilverMatches);
        
        // Si no hay partidos de plata pero se intenta mostrar la sección de plata
        const showingGoldTab = currentSlide < Math.max(1, Math.ceil(goldGroupMatches.length / matchesPerSlide));
        const wantsSilverButNoMatches = !showingGoldTab && !hasSilverMatches;
        
        console.log('Quiere mostrar plata pero no hay partidos:', wantsSilverButNoMatches);
        
        // Calcular slides
        const totalSlidesGold = Math.max(1, Math.ceil(goldGroupMatches.length / matchesPerSlide));
        const totalSlidesSilver = Math.max(1, Math.ceil(silverGroupMatches.length / matchesPerSlide));
        
        console.log('Cantidad de slides: Oro =', totalSlidesGold, ', Plata =', totalSlidesSilver);
        console.log('Slide actual:', currentSlide);
        
        // Acotar el slide actual al rango permitido
        let effectiveSlide = currentSlide;
        const totalSlides = totalSlidesGold + totalSlidesSilver;
        if (effectiveSlide >= totalSlides) {
          effectiveSlide = 0; // Resetear a la primera slide si estamos fuera de rango
          setCurrentSlide(0);
        }
        
        // Determinar qué grupo mostrar basado en el slide actual
        const isGoldGroup = effectiveSlide < totalSlidesGold;
        
        console.log('Slider efectivo:', effectiveSlide, 'Mostrando grupo:', isGoldGroup ? 'Oro' : 'Plata');
        
        return (
          <div className="flex-1 flex flex-col" {...swipeHandlers}>
            <div className="transition-all duration-500 ease-in-out">
              {isGoldGroup ? (
                renderMatchGroup(goldGroupMatches, 'Grupo Oro', 'bg-yellow-50', currentSlide)
              ) : (
                renderMatchGroup(silverGroupMatches, 'Grupo Plata', 'bg-gray-50', currentSlide - totalSlidesGold)
              )}
            </div>
          </div>
        );
      }
    }

    // Para otras fases, mostrar todos los partidos juntos
    return (
      <div className="flex-1 flex flex-col" {...swipeHandlers}>
        <div className="transition-all duration-500 ease-in-out">
          {renderMatchGroup(nextMatches, PHASE_LABELS[nextMatchday.phase], 'bg-gray-50', currentSlide)}
        </div>
      </div>
    );
  };

  const formatChileDate = (dateString) => {
    // Create a date object in Chile's timezone
    const date = new Date(dateString);
    // Add one day to the date
    date.setDate(date.getDate() + 1);
    // Adjust the date to Chile's timezone (UTC-4 or UTC-3)
    const chileDate = new Date(date.getTime() - (date.getTimezoneOffset() * 60000));
    
    // Format the date in Spanish
    return chileDate.toLocaleDateString('es-CL', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'America/Santiago'
    }).replace(/^\w/, c => c.toUpperCase());
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
            <Link to="/gallery" className="bg-accent text-white p-4 rounded text-center hover:bg-accent-dark transition duration-300">Galería</Link>
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
                      {formatChileDate(nextMatchday.date_time)}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col h-full">
                  <div className="p-3 border-b">
                    {nextMatchday.phase.includes('group_a') || nextMatchday.phase.includes('group_b') ? (
                      <div className="flex items-center justify-between">
                        <div className="flex gap-2">
                          <button
                            onClick={() => setCurrentSlide(0)}
                            className={`px-3 py-1.5 text-sm rounded-md transition-all duration-300 ${
                              currentSlide < Math.ceil(nextMatches.filter(m => m.phase === 'group_a').length / matchesPerSlide)
                                ? 'bg-blue-600 text-white shadow-md' 
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                          >
                            Grupo A
                          </button>
                          <button
                            onClick={() => setCurrentSlide(Math.ceil(nextMatches.filter(m => m.phase === 'group_a').length / matchesPerSlide))}
                            className={`px-3 py-1.5 text-sm rounded-md transition-all duration-300 ${
                              currentSlide >= Math.ceil(nextMatches.filter(m => m.phase === 'group_a').length / matchesPerSlide)
                                ? 'bg-green-600 text-white shadow-md' 
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                          >
                            Grupo B
                          </button>
                        </div>
                        <Link 
                          to="/schedule" 
                          className="text-sm text-accent hover:text-accent-dark transition-colors duration-300 flex items-center gap-1"
                        >
                          Ver calendario completo
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </Link>
                      </div>
                    ) : nextMatchday.phase.includes('gold_group') || nextMatchday.phase.includes('silver_group') ? (
                      <div className="flex items-center justify-between">
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              console.log('Cambiando a Grupo Oro (slide 0)');
                              setCurrentSlide(0);
                            }}
                            className={`px-3 py-1.5 text-sm rounded-md transition-all duration-300 ${
                              // Verificar si estamos mostrando los partidos de Oro
                              currentSlide < Math.max(1, Math.ceil(nextMatches.filter(m => m.phase === 'gold_group').length / matchesPerSlide))
                                ? 'bg-yellow-600 text-white shadow-md' 
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                          >
                            Grupo Oro
                          </button>
                          <button
                            onClick={() => {
                              // Calcular donde empiezan los partidos de Plata
                              const goldMatches = nextMatches.filter(m => m.phase === 'gold_group');
                              const slidesForGold = Math.max(1, Math.ceil(goldMatches.length / matchesPerSlide));
                              console.log('Cambiando a Grupo Plata (slide', slidesForGold, ')');
                              setCurrentSlide(slidesForGold);
                            }}
                            className={`px-3 py-1.5 text-sm rounded-md transition-all duration-300 ${
                              // Verificar si estamos mostrando los partidos de Plata
                              currentSlide >= Math.max(1, Math.ceil(nextMatches.filter(m => m.phase === 'gold_group').length / matchesPerSlide))
                                ? 'bg-gray-600 text-white shadow-md' 
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                          >
                            Grupo Plata
                          </button>
                        </div>
                        <Link 
                          to="/schedule" 
                          className="text-sm text-accent hover:text-accent-dark transition-colors duration-300 flex items-center gap-1"
                        >
                          Ver calendario completo
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </Link>
                      </div>
                    ) : (
                      <div className="flex justify-end">
                        <Link 
                          to="/schedule" 
                          className="text-sm text-accent hover:text-accent-dark transition-colors duration-300 flex items-center gap-1"
                        >
                          Ver calendario completo
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </Link>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 overflow-auto">
                    <div className="p-3">
                      {nextMatchesDisplay()}
                    </div>
                  </div>
                  {(nextMatchday.phase.includes('group_a') || 
                    nextMatchday.phase.includes('group_b') ||
                    nextMatchday.phase.includes('gold_group') || 
                    nextMatchday.phase.includes('silver_group')) && (
                    <div className="p-3 border-t">
                      <div className="flex justify-center gap-1.5">
                        {Array.from({ 
                          length: Math.ceil(nextMatches.length / matchesPerSlide)
                        }).map((_, index) => (
                          <button
                            key={index}
                            onClick={() => setCurrentSlide(index)}
                            className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                              currentSlide === index ? 'bg-green-600 w-3' : 'bg-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  )}
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
          <div className="relative">
            <div className="overflow-hidden">
              {/* Grid para pantallas grandes */}
              <div className="hidden md:grid md:grid-cols-4 lg:grid-cols-6 gap-4 py-4 justify-items-center">
                {!sponsorsLoading && sponsors.length > 0 && sponsors.map((sponsor) => (
                  <div key={sponsor.id} className="text-center">
                    <div className="w-32 h-32 mx-auto mb-3 bg-white rounded-lg shadow-md overflow-hidden">
                      {sponsor.image ? (
                        <img
                          src={pb.getFileUrl(sponsor, sponsor.image)}
                          alt={sponsor.name}
                          className="w-full h-full object-contain p-2"
                          onError={(e) => {
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
                ))}
              </div>

              {/* Carousel para pantallas pequeñas */}
              <div 
                id="sponsors-container"
                className="md:hidden flex gap-4 py-4"
              >
                {sponsorsLoading ? (
                  // Loading skeleton
                  Array(3).fill(0).map((_, index) => (
                    <div key={`skeleton-${index}`} className="flex-shrink-0 w-32 h-32 bg-gray-200 rounded-lg animate-pulse" />
                  ))
                ) : sponsors.length > 0 ? (
                  <>
                    {[...sponsors, ...sponsors].map((sponsor, index) => (
                      <div key={`${sponsor.id}-${index}`} className="flex-shrink-0 text-center">
                        <div className="w-32 h-32 mx-auto mb-3 bg-white rounded-lg shadow-md overflow-hidden">
                          {sponsor.image ? (
                            <img
                              src={pb.getFileUrl(sponsor, sponsor.image)}
                              alt={sponsor.name}
                              className="w-full h-full object-contain p-2"
                              onError={(e) => {
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
                    ))}
                  </>
                ) : (
                  <p className="text-gray-500">No hay patrocinadores disponibles</p>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>

      <style jsx>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }

        @keyframes scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-220%);
          }
        }

        #sponsors-container {
          animation: scroll 20s linear infinite;
        }

        #sponsors-container:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
};

export default Home;