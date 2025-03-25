import React from 'react';
import { useParams } from 'react-router-dom';
import { useTeam } from '../hooks/teams/useTeam';
import { useTeamPlayers } from '../hooks/players/useTeamPlayers';
import { Trophy, Goal, ShieldAlert, Users, Star, TrendingUp, Image as ImageIcon } from 'lucide-react';
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
  BarChart,
} from '@tremor/react';
import { motion } from 'framer-motion';

const TeamView = () => {
  const { teamId } = useParams();
  const { team, loading: teamLoading, error: teamError } = useTeam(teamId);
  const { players, loading: playersLoading, error: playersError } = useTeamPlayers(teamId);

  // Assuming you'll have a hook for gallery images
  const galleryImages = team?.gallery || [];

  if (teamLoading || playersLoading) return <div className="text-center py-8">Cargando detalles del equipo...</div>;
  if (teamError || playersError) return <div className="text-center py-8 text-red-500">Error al cargar los datos</div>;
  if (!team) return <div className="text-center py-8">Equipo no encontrado</div>;

  const totalMatches = team.won_matches + team.drawn_matches + team.lost_matches;
  const winRate = (team.won_matches / totalMatches) * 100;

  // Get captain name from expanded relation
  const captainName = team.expand?.captain_id ? 
    `${team.expand.captain_id.first_name} ${team.expand.captain_id.last_name}` : 
    'No asignado';

  // Custom colors that match your theme
  const chartColors = {
    Ganados: 'emerald',     // Success color
    Empatados: 'accent',    // Your accent color
    Perdidos: 'red',        // Error color
  };

  const matchData = [
    {
      name: 'Partidos',
      'Ganados': team.won_matches,
      'Empatados': team.drawn_matches,
      'Perdidos': team.lost_matches,
    },
  ];

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
                          <div className="grid grid-cols-2 gap-2">
                            <div className="flex flex-col items-center p-2 bg-gray-50 rounded">
                              <span className="text-sm text-gray-600 mb-1">Goles</span>
                              <Badge color="emerald" className="mx-auto bg-emerald-100 text-emerald-700">
                                {player.scored_goals}
                              </Badge>
                            </div>
                            <div className="flex flex-col items-center p-2 bg-gray-50 rounded">
                              <span className="text-sm text-gray-600 mb-1">MVP</span>
                              <Badge className="mx-auto bg-accent/10 text-accent">
                                {player.man_of_the_match}
                              </Badge>
                            </div>
                            <div className="flex flex-col items-center p-2 bg-gray-50 rounded">
                              <span className="text-sm text-gray-600 mb-1">T. Amarillas</span>
                              <Badge className="mx-auto bg-yellow-100 text-yellow-700 border border-yellow-200">
                                {player.yellow_cards}
                              </Badge>
                            </div>
                            <div className="flex flex-col items-center p-2 bg-gray-50 rounded">
                              <span className="text-sm text-gray-600 mb-1">T. Rojas</span>
                              <Badge className="mx-auto bg-red-100 text-red-700 border border-red-200">
                                {player.red_cards}
                              </Badge>
                            </div>
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
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {players.map((player) => (
                            <TableRow key={player.id} className="hover:bg-gray-50/50">
                              <TableCell className="font-medium">{`${player.first_name} ${player.last_name}`}</TableCell>
                              <TableCell className="text-center">
                                <Badge color="emerald" className="mx-auto bg-emerald-100 text-emerald-700">
                                  {player.scored_goals}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge className="mx-auto bg-yellow-100 text-yellow-700 border border-yellow-200">
                                  {player.yellow_cards}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge className="mx-auto bg-red-100 text-red-700 border border-red-200">
                                  {player.red_cards}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge className="mx-auto bg-accent/10 text-accent">
                                  {player.man_of_the_match}
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
                    
                    {galleryImages.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {galleryImages.map((image, index) => (
                          <motion.div
                            key={index}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="relative aspect-square rounded-lg overflow-hidden"
                          >
                            <img
                              src={image.url}
                              alt={`Team gallery ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300">
                              <div className="absolute bottom-0 left-0 right-0 p-4">
                                <p className="text-white text-sm">{image.description || `Foto ${index + 1}`}</p>
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
    </main>
  );
};

export default TeamView;