import React, { useState, useEffect } from 'react';
import { pb } from '../config';
import { Search, Download, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  fetchGalleryImages,
  fetchTeams,
  fetchMatchdays,
} from '../hooks/admin/galleryHandlers';

const translatePhase = (phase) => {
  if (!phase) return '';
  return phase
    .replace('group_a', 'Grupo A')
    .replace('group_b', 'Grupo B')
    .replace('gold_group', 'Grupo Oro')
    .replace('silver_group', 'Grupo Plata');
};

const Gallery = () => {
  const [images, setImages] = useState([]);
  const [teams, setTeams] = useState([]);
  const [matchdays, setMatchdays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedMatchday, setSelectedMatchday] = useState(null);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [filters, setFilters] = useState({
    team: '',
    search: '',
  });
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [imagesData, teamsData, matchdaysData] = await Promise.all([
        fetchGalleryImages(),
        fetchTeams(),
        fetchMatchdays(),
      ]);
      setImages(imagesData);
      setTeams(teamsData);
      setMatchdays(matchdaysData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const groupedByMatchday = images.reduce((acc, image) => {
    const matchdayId = image.expand?.matchday?.id;
    if (!matchdayId) return acc;
    
    if (!acc[matchdayId]) {
      acc[matchdayId] = {
        matchday: {
          ...image.expand.matchday,
          phase: translatePhase(image.expand.matchday.phase)
        },
        matches: new Map(),
        teams: new Map()
      };
    }
    
    const matchKey = `${image.expand?.team1?.id}_${image.expand?.team2?.id}`;
    if (!acc[matchdayId].matches.has(matchKey)) {
      acc[matchdayId].matches.set(matchKey, {
        team1: image.expand?.team1,
        team2: image.expand?.team2,
        images: []
      });
    }
    acc[matchdayId].matches.get(matchKey).images.push(image);
    
    if (image.expand?.team1?.id) acc[matchdayId].teams.set(image.expand.team1.id, image.expand.team1);
    if (image.expand?.team2?.id) acc[matchdayId].teams.set(image.expand.team2.id, image.expand.team2);
    
    return acc;
  }, {});

  const filteredMatches = selectedMatchday ? 
    Array.from(groupedByMatchday[selectedMatchday]?.matches?.values() || [])
      .filter(match => {
        const matchesTeam = !filters.team || 
          match.team1?.id === filters.team || 
          match.team2?.id === filters.team;
        
        const matchesSearch = !filters.search || 
          match.team1?.name.toLowerCase().includes(filters.search.toLowerCase()) ||
          match.team2?.name.toLowerCase().includes(filters.search.toLowerCase());

        return matchesTeam && matchesSearch;
      }) : [];

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

  const handleNextPhoto = () => {
    if (selectedMatch && selectedMatch.images) {
      setCurrentPhotoIndex((prevIndex) => 
        prevIndex === selectedMatch.images.length - 1 ? 0 : prevIndex + 1
      );
    }
  };

  const handlePrevPhoto = () => {
    if (selectedMatch && selectedMatch.images) {
      setCurrentPhotoIndex((prevIndex) => 
        prevIndex === 0 ? selectedMatch.images.length - 1 : prevIndex - 1
      );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Galería de Fotos</h1>

      {!selectedMatchday ? (
        // Vista de Jornadas
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.entries(groupedByMatchday)
            .sort((a, b) => b[1].matchday.number - a[1].matchday.number)
            .map(([matchdayId, data]) => (
              <motion.div
                key={matchdayId}
                className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer"
                whileHover={{ scale: 1.02 }}
                onClick={() => setSelectedMatchday(matchdayId)}
              >
                <div className="aspect-video relative">
                  {data.matches.size > 0 && data.matches.values().next().value.images[0]?.image ? (
                    <img
                      src={pb.getFileUrl(data.matches.values().next().value.images[0], data.matches.values().next().value.images[0].image)}
                      alt={`Jornada ${data.matchday.number}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100">
                      <div className="text-gray-400 text-center">
                        <div className="text-4xl mb-2">J{data.matchday.number}</div>
                        <div className="text-sm">{data.matchday.phase || 'Fase Regular'}</div>
                      </div>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
                    <div className="text-white text-center">
                      <h3 className="text-xl font-semibold mb-1">
                        Jornada {data.matchday.number}
                      </h3>
                      <p className="text-sm">
                        {data.matchday.phase ? `(${data.matchday.phase})` : 'Fase Regular'}
                      </p>
                      <p className="text-sm mt-2">
                        {data.matches.size} {data.matches.size === 1 ? 'partido' : 'partidos'}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
        </div>
      ) : !selectedMatch ? (
        // Vista de Partidos de una Jornada
        <div>
          <div className="flex items-center mb-6">
            <button
              onClick={() => setSelectedMatchday(null)}
              className="flex items-center text-blue-500 hover:text-blue-600 mr-4"
            >
              <ChevronLeft className="w-5 h-5 mr-1" />
              Volver a Jornadas
            </button>
            <h2 className="text-2xl font-semibold">
              Jornada {groupedByMatchday[selectedMatchday]?.matchday.number}
              {groupedByMatchday[selectedMatchday]?.matchday.phase ? 
                ` (${groupedByMatchday[selectedMatchday].matchday.phase})` : ''}
            </h2>
          </div>

          {/* Filtros para la jornada seleccionada */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Team Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Equipo
                </label>
                <select
                  value={filters.team}
                  onChange={(e) => setFilters({ ...filters, team: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Todos los equipos</option>
                  {Array.from(groupedByMatchday[selectedMatchday]?.teams?.values() || []).map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Search Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Buscar
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    placeholder="Buscar por equipo..."
                    className="w-full px-3 py-2 border rounded-lg pl-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                </div>
              </div>
            </div>
          </div>

          {/* Matches Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMatches.map((match, index) => (
              <motion.div
                key={index}
                className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer"
                whileHover={{ scale: 1.02 }}
                onClick={() => setSelectedMatch(match)}
              >
                <div className="aspect-video relative">
                  {match.images[0]?.image ? (
                    <img
                      src={pb.getFileUrl(match.images[0], match.images[0].image)}
                      alt={`${match.team1?.name} vs ${match.team2?.name}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100">
                      <div className="text-gray-400 text-center">
                        <div className="text-2xl mb-2">{match.team1?.name}</div>
                        <div className="text-sm">vs</div>
                        <div className="text-2xl mt-2">{match.team2?.name}</div>
                      </div>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
                    <div className="text-white text-center">
                      <h3 className="text-xl font-semibold mb-1">
                        {match.team1?.name} vs {match.team2?.name}
                      </h3>
                      <p className="text-sm">
                        {match.images.length} {match.images.length === 1 ? 'foto' : 'fotos'}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      ) : (
        // Vista de Fotos de un Partido
        <div>
          <div className="flex items-center mb-6">
            <button
              onClick={() => setSelectedMatch(null)}
              className="flex items-center text-blue-500 hover:text-blue-600 mr-4"
            >
              <ChevronLeft className="w-5 h-5 mr-1" />
              Volver a Partidos
            </button>
            <h2 className="text-2xl font-semibold">
              {selectedMatch.team1?.name} vs {selectedMatch.team2?.name}
            </h2>
          </div>

          {/* Image Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {selectedMatch.images.map((image) => (
              <motion.div
                key={image.id}
                className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer"
                whileHover={{ scale: 1.02 }}
                onClick={() => setSelectedImage(image)}
              >
                <div className="aspect-video relative">
                  <img
                    src={pb.getFileUrl(image, image.image)}
                    alt={`${image.expand?.team1?.name} vs ${image.expand?.team2?.name}`}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-30 transition-opacity duration-300 flex items-center justify-center">
                    <Download className="w-8 h-8 text-white opacity-0 hover:opacity-100 transition-opacity duration-300" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

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
                {/* Navigation buttons */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePrevPhoto();
                    setSelectedImage(selectedMatch.images[currentPhotoIndex]);
                  }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-white bg-opacity-75 rounded-full p-2 hover:bg-opacity-100 transition-opacity"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNextPhoto();
                    setSelectedImage(selectedMatch.images[currentPhotoIndex]);
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-white bg-opacity-75 rounded-full p-2 hover:bg-opacity-100 transition-opacity"
                >
                  <ChevronRight className="w-6 h-6" />
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
                        `(${translatePhase(selectedImage.expand.matchday.phase)})` : ''}
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
                <div className="flex justify-center gap-2 mt-4">
                  {selectedMatch?.images?.map((_, index) => (
                    <button
                      key={index}
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentPhotoIndex(index);
                        setSelectedImage(selectedMatch.images[index]);
                      }}
                      className={`w-2 h-2 rounded-full transition-all ${
                        index === currentPhotoIndex ? 'bg-blue-500 w-4' : 'bg-gray-300'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Gallery;
