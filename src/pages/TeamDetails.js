import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useTeam } from '../hooks/teams/useTeam';
import { useTeamPlayers } from '../hooks/players/useTeamPlayers';
import { Trophy, Goal, ShieldAlert, Users, Star, TrendingUp, Image as ImageIcon, Download, X } from 'lucide-react';
import { pb } from '../config';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchGalleryImages } from '../hooks/admin/galleryHandlers';
import {
  Card,
  Title,
  Text,
  TabGroup,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Metric,
  Flex,
  ProgressBar,
  Badge,
  Table,
  TableHead,
  TableHeaderCell,
  TableBody,
  TableRow,
  TableCell,
} from '@tremor/react';

const TeamView = () => {
  const { teamId } = useParams();
  const { team, loading: teamLoading, error: teamError } = useTeam(teamId);
  const { players, loading: playersLoading, error: playersError } = useTeamPlayers(teamId);
  const [galleryImages, setGalleryImages] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [loadingImages, setLoadingImages] = useState(true);

  useEffect(() => {
    const loadGalleryImages = async () => {
      try {
        setLoadingImages(true);
        const images = await fetchGalleryImages();
        // Filter images where the team appears in either team1 or team2
        const teamImages = images.filter(image => 
          image.expand?.team1?.id === teamId || image.expand?.team2?.id === teamId
        );
        setGalleryImages(teamImages);
      } catch (error) {
        console.error('Error loading gallery images:', error);
      } finally {
        setLoadingImages(false);
      }
    };

    if (teamId) {
      loadGalleryImages();
    }
  }, [teamId]);

  const handleDownload = async (image) => {
    try {
      const url = pb.getFileUrl(image, image.image);
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `gallery-${image.id}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Error downloading image:', error);
    }
  };

  if (teamLoading || playersLoading) return <div className="text-center py-8">Cargando detalles del equipo...</div>;
  if (teamError || playersError) return <div className="text-center py-8 text-red-500">Error al cargar los datos</div>;
  if (!team) return <div className="text-center py-8">Equipo no encontrado</div>;

  const totalMatches = team.won_matches + team.drawn_matches + team.lost_matches;
  const winRate = (team.won_matches / totalMatches) * 100;

  // Get captain name from expanded relation
  const captainName = team.expand?.captain_id ? 
    `${team.expand.captain_id.first_name} ${team.expand.captain_id.last_name}` : 
    'No asignado';

  return (
    <main className="bg-gradient-to-br from-body to-body-secondary min-h-screen p-4 sm:p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="mb-8 bg-body-secondary backdrop-blur-sm border border-gray-200/50">
          <Flex className="flex-col items-center text-center px-2 py-4 sm:p-6">
            {team.logoUrl ? (
              <motion.img 
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                whileHover={{ scale: 1.05 }}
                src={team.logoUrl} 
                alt={`${team.name} logo`} 
                className="w-28 h-28 sm:w-32 sm:h-32 rounded-full mb-4 shadow-lg border-4 border-accent"
              />
            ) : (
              <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full mb-4 bg-accent/10 flex items-center justify-center">
                <Users className="w-10 h-10 sm:w-12 sm:h-12 text-accent" />
              </div>
            )}
            <div className="space-y-3 w-full">
              <Title className="text-text text-2xl sm:text-3xl">{team.name}</Title>
              <div className="flex items-center justify-center space-x-2">
                <Star className="w-5 h-5 text-accent" />
                <Text className="text-text-dark">Capitán: {captainName}</Text>
              </div>
              <Text className="text-text-dark text-xs sm:text-sm uppercase tracking-wide mt-2">Estadísticas temporada actual</Text>
              <Text className="text-text-dark italic text-sm sm:text-base max-w-lg mx-auto">
                {team.description}
              </Text>
            </div>
          </Flex>
        </Card>

        <TabGroup className="mt-6">
          <TabList className="bg-body-secondary rounded-lg p-1 overflow-x-auto flex whitespace-nowrap sticky top-0 z-10 shadow-md mb-4">
            <Tab className="flex-1 px-4 sm:px-6 py-3 rounded-md data-[selected]:bg-accent data-[selected]:text-white transition-all text-sm sm:text-base">
              Resumen
            </Tab>
            <Tab className="flex-1 px-4 sm:px-6 py-3 rounded-md data-[selected]:bg-accent data-[selected]:text-white transition-all text-sm sm:text-base">
              Jugadores
            </Tab>
            <Tab className="flex-1 px-4 sm:px-6 py-3 rounded-md data-[selected]:bg-accent data-[selected]:text-white transition-all text-sm sm:text-base">
              Galería
            </Tab>
          </TabList>
          <TabPanels>
            <TabPanel>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                <motion.div 
                  whileHover={{ scale: 1.02 }} 
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <Card decoration="top" decorationColor="emerald" className="bg-body-secondary hover:shadow-lg transition-shadow">
                    <Flex className="flex-col sm:flex-row items-center sm:items-start text-center sm:text-left p-4">
                      <Trophy className="w-8 h-8 text-emerald-500 mb-2 sm:mb-0 sm:mr-3" />
                      <div>
                        <Text className="text-text-dark text-sm sm:text-base">Porcentaje de Victoria</Text>
                        <Metric className="text-text text-2xl sm:text-3xl">{winRate.toFixed(1)}%</Metric>
                      </div>
                    </Flex>
                    <ProgressBar value={winRate} color="emerald" className="mt-3" />
                  </Card>
                </motion.div>

                <motion.div 
                  whileHover={{ scale: 1.02 }} 
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <Card decoration="top" decorationColor="blue" className="bg-body-secondary hover:shadow-lg transition-shadow">
                    <Flex className="flex-col sm:flex-row items-center sm:items-start text-center sm:text-left p-4">
                      <Goal className="w-8 h-8 text-blue-500 mb-2 sm:mb-0 sm:mr-3" />
                      <div>
                        <Text className="text-text-dark text-sm sm:text-base">Goles Anotados</Text>
                        <Metric className="text-text text-2xl sm:text-3xl">{team.scored_goals}</Metric>
                      </div>
                    </Flex>
                  </Card>
                </motion.div>

                <motion.div 
                  whileHover={{ scale: 1.02 }} 
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <Card decoration="top" decorationColor="orange" className="bg-body-secondary hover:shadow-lg transition-shadow">
                    <Flex className="flex-col sm:flex-row items-center sm:items-start text-center sm:text-left p-4">
                      <ShieldAlert className="w-8 h-8 text-orange-500 mb-2 sm:mb-0 sm:mr-3" />
                      <div>
                        <Text className="text-text-dark text-sm sm:text-base">Goles Recibidos</Text>
                        <Metric className="text-text text-2xl sm:text-3xl">{team.conceived_goals}</Metric>
                      </div>
                    </Flex>
                  </Card>
                </motion.div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mt-6">
                <motion.div whileHover={{ scale: 1.02 }} transition={{ type: "spring", stiffness: 300 }}>
                  <Card className="bg-body-secondary hover:shadow-lg transition-shadow">
                    <div className="flex items-center mb-4">
                      <TrendingUp className="w-6 h-6 text-accent mr-2" />
                      <Title className="text-text text-base sm:text-lg">Estadísticas de Partidos</Title>
                    </div>
                    <div className="mt-4">
                      <Flex>
                        <Text className="text-text-dark">Partidos Ganados</Text>
                        <Text className="text-text">{team.won_matches}</Text>
                      </Flex>
                      <ProgressBar value={team.won_matches / totalMatches * 100} color="green" className="mt-2" />
                      
                      <Flex className="mt-4">
                        <Text className="text-text-dark">Partidos Empatados</Text>
                        <Text className="text-text">{team.drawn_matches}</Text>
                      </Flex>
                      <ProgressBar value={team.drawn_matches / totalMatches * 100} color="blue" className="mt-2" />
                      
                      <Flex className="mt-4">
                        <Text className="text-text-dark">Partidos Perdidos</Text>
                        <Text className="text-text">{team.lost_matches}</Text>
                      </Flex>
                      <ProgressBar value={team.lost_matches / totalMatches * 100} color="red" className="mt-2" />
                    </div>
                  </Card>
                </motion.div>

                <motion.div whileHover={{ scale: 1.02 }} transition={{ type: "spring", stiffness: 300 }}>
                  <Card className="bg-body-secondary hover:shadow-lg transition-shadow">
                    <div className="flex items-center mb-4">
                      <TrendingUp className="w-6 h-6 text-accent mr-2" />
                      <Title className="text-text text-base sm:text-lg">Estadísticas de Goles</Title>
                    </div>
                    <div className="mt-4">
                      <Flex>
                        <Text className="text-text-dark">Goles Anotados</Text>
                        <Text className="text-text">{team.scored_goals}</Text>
                      </Flex>
                      <Flex className="mt-4">
                        <Text className="text-text-dark">Goles Recibidos</Text>
                        <Text className="text-text">{team.conceived_goals}</Text>
                      </Flex>
                      <Flex className="mt-4">
                        <Text className="text-text-dark">Diferencia de Goles</Text>
                        <Text className="text-text">{team.scored_goals - team.conceived_goals}</Text>
                      </Flex>
                    </div>
                  </Card>
                </motion.div>
              </div>
            </TabPanel>

            <TabPanel>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                <Card className="bg-body-secondary hover:shadow-lg transition-shadow">
                  <div className="p-4">
                    <div className="flex items-center mb-4">
                      <Users className="w-6 h-6 text-accent mr-2" />
                      <Title className="text-text text-base sm:text-lg">Plantilla del Equipo</Title>
                    </div>
                    
                    {/* Mobile View */}
                    <div className="block sm:hidden">
                      {players.map((player) => (
                        <motion.div
                          key={player.id}
                          className="mb-4 p-4 bg-white rounded-lg shadow-sm"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <h3 className="font-medium text-lg mb-2">{`${player.first_name} ${player.last_name}`}</h3>
                          <div className="grid grid-cols-2 gap-4 mt-2">
                            {[
                              { label:'Goles', val:player.scored_goals, color:'text-emerald-600'},
                              { label:'MVP', val:player.man_of_the_match, color:'text-blue-600'},
                              { label:'T. Amarillas', val:player.yellow_cards, color:'text-yellow-600'},
                              { label:'T. Rojas', val:player.red_cards, color:'text-red-600'},
                              { label:'Inscrito', val:player.is_inactive?'No':'Sí', color: player.is_inactive?'text-gray-500':'text-emerald-600'},
                            ].map((stat)=>(
                              <div key={stat.label} className="flex flex-col items-center">
                                <span className="text-xs text-gray-500">{stat.label}</span>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${stat.color} ${
                                  stat.label==='Goles' ? 'bg-emerald-100' :
                                  stat.label==='MVP' ? 'bg-blue-100' :
                                  stat.label==='T. Amarillas' ? 'bg-yellow-100' :
                                  stat.label==='T. Rojas' ? 'bg-red-100' :
                                  stat.label==='Inscrito' ? (stat.val==='Sí' ? 'bg-emerald-100' : 'bg-gray-200') : 'bg-gray-100'
                                }`}>{stat.val}</span>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      ))}
                    </div>

                    {/* Desktop View */}
                    <div className="hidden sm:block overflow-x-auto">
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableHeaderCell>Nombre</TableHeaderCell>
                            <TableHeaderCell className="text-center">Goles</TableHeaderCell>
                            <TableHeaderCell className="text-center">T. Amarillas</TableHeaderCell>
                            <TableHeaderCell className="text-center">T. Rojas</TableHeaderCell>
                            <TableHeaderCell className="text-center">MVP</TableHeaderCell>
                            <TableHeaderCell className="text-center">Inscrito</TableHeaderCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {players.map((player) => (
                            <TableRow key={player.id} className="hover:bg-gray-50/50">
                              <TableCell className="font-medium">{`${player.first_name} ${player.last_name}`}</TableCell>
                              <TableCell className="text-center font-semibold text-emerald-600">
                                {player.scored_goals}
                              </TableCell>
                              <TableCell className="text-center font-medium text-yellow-600">
                                {player.yellow_cards}
                              </TableCell>
                              <TableCell className="text-center font-medium text-red-600">
                                {player.red_cards}
                              </TableCell>
                              <TableCell className="text-center font-semibold text-blue-600">
                                {player.man_of_the_match}
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge className={`mx-auto ${player.is_inactive ? 'bg-gray-200 text-gray-500' : 'bg-emerald-100 text-emerald-700'}`}>
                                  {player.is_inactive ? 'No' : 'Sí'}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </Card>
              </motion.div>
            </TabPanel>

            <TabPanel>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                <Card className="bg-body-secondary hover:shadow-lg transition-shadow">
                  <div className="p-4">
                    <div className="flex items-center mb-4">
                      <ImageIcon className="w-6 h-6 text-accent mr-2" />
                      <Title className="text-text text-base sm:text-lg">Galería del Equipo</Title>
                    </div>
                    
                    {loadingImages ? (
                      <div className="flex justify-center items-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                      </div>
                    ) : galleryImages.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {galleryImages.map((image) => (
                          <motion.div
                            key={image.id}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="relative aspect-video rounded-lg overflow-hidden cursor-pointer"
                            onClick={() => setSelectedImage(image)}
                          >
                            <img
                              src={pb.getFileUrl(image, image.image)}
                              alt={`${image.expand?.team1?.name} vs ${image.expand?.team2?.name}`}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-30 transition-opacity duration-300 flex items-center justify-center">
                              <div className="absolute bottom-0 left-0 right-0 p-4">
                                <p className="text-white text-sm">{image.expand?.team1?.name} vs {image.expand?.team2?.name}</p>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 text-text-dark">
                        <ImageIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No hay imágenes disponibles en la galería</p>
                      </div>
                    )}
                  </div>
                </Card>
              </motion.div>
            </TabPanel>
          </TabPanels>
        </TabGroup>
      </motion.div>

      {/* Image Modal */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedImage(null)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative">
                <img
                  src={pb.getFileUrl(selectedImage, selectedImage.image)}
                  alt={`${selectedImage.expand?.team1?.name} vs ${selectedImage.expand?.team2?.name}`}
                  className="w-full max-h-[70vh] object-contain"
                />
                <button
                  onClick={() => setSelectedImage(null)}
                  className="absolute top-4 right-4 bg-white bg-opacity-75 rounded-full p-2 hover:bg-opacity-100 transition-opacity"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h3 className="text-xl font-semibold">
                      {selectedImage.expand?.team1?.name} vs {selectedImage.expand?.team2?.name}
                    </h3>
                    <p className="text-gray-600">
                      Jornada {selectedImage.expand?.matchday?.number} {selectedImage.expand?.matchday?.phase ? 
                        `(${selectedImage.expand.matchday.phase})` : ''}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDownload(selectedImage)}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                  >
                    <Download className="w-5 h-5" />
                    Descargar
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
};

export default TeamView;