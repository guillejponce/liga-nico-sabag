import React, { useState, useEffect, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Loader2, Upload, X, Trash2, Image as ImageIcon } from 'lucide-react';
import { toast } from 'react-hot-toast';
import imageCompression from 'browser-image-compression';
import { pb } from '../../config';
import {
  fetchGalleryImages,
  uploadGalleryImage,
  deleteGalleryImage,
  fetchLatestMatchday,
  fetchTeams,
  fetchMatchdays,
} from '../../hooks/admin/galleryHandlers';

const AdminGallery = () => {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [teams, setTeams] = useState([]);
  const [matchdays, setMatchdays] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [metadata, setMetadata] = useState({
    team1: '',
    team2: '',
    matchday: '',
  });
  const [overallProgress, setOverallProgress] = useState(0);
  const [uploadMode, setUploadMode] = useState('matchday'); // 'matchday' or 'teams'
  const [expandedMatch, setExpandedMatch] = useState(null);

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
      
      // Set latest matchday as default
      if (matchdaysData.length > 0) {
        setMetadata(prev => ({ ...prev, matchday: matchdaysData[0].id }));
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Error loading data');
    } finally {
      setLoading(false);
    }
  };

  const optimizeImage = async (file) => {
    const options = {
      maxSizeMB: 1,
      maxWidthOrHeight: 2048,
      useWebWorker: true,
      initialQuality: 0.85,
    };
    
    try {
      return await imageCompression(file, options);
    } catch (error) {
      console.error('Error optimizing image:', error);
      return file; // Return original file if optimization fails
    }
  };

  const onDrop = useCallback(async (acceptedFiles) => {
    // Show loading toast
    const loadingToast = toast.loading('Processing images...');

    try {
      // Process files in parallel
      const processedFiles = await Promise.all(
        acceptedFiles.map(async (file) => {
          const optimized = await optimizeImage(file);
          return {
            file: optimized, // Store the optimized file
            preview: URL.createObjectURL(optimized),
            uploading: false,
            error: null,
            progress: 0
          };
        })
      );

      setSelectedFiles(prev => [...prev, ...processedFiles]);
      toast.success(`${acceptedFiles.length} images processed`);
    } catch (error) {
      console.error('Error processing images:', error);
      toast.error('Error processing images');
    } finally {
      toast.dismiss(loadingToast);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    multiple: true,
  });

  const removeSelectedFile = (index) => {
    setSelectedFiles(prev => {
      const newFiles = [...prev];
      URL.revokeObjectURL(newFiles[index].preview);
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  const handleUpload = async () => {
    // Validation based on mode
    if (uploadMode === 'teams') {
      if (!metadata.team1 || !metadata.team2) {
        toast.error('Please select both teams');
        return;
      }
    }

    if (!metadata.matchday) {
      toast.error('Please select a matchday');
      return;
    }

    if (selectedFiles.length === 0) {
      toast.error('Please select images to upload');
      return;
    }

    setUploading(true);
    setOverallProgress(0);
    let completedUploads = 0;
    const totalFiles = selectedFiles.length;

    try {
      for (let index = 0; index < selectedFiles.length; index++) {
        const selectedFile = selectedFiles[index];
        
        try {
          console.log('Starting upload for file:', selectedFile.file.name);
          
          setSelectedFiles(prev => {
            const newFiles = [...prev];
            newFiles[index] = { ...newFiles[index], uploading: true, progress: 0 };
            return newFiles;
          });

          // Only include team metadata if in team mode
          const uploadMetadata = uploadMode === 'teams' 
            ? metadata 
            : { matchday: metadata.matchday };

          await uploadGalleryImage(selectedFile.file, uploadMetadata, (progress) => {
            setSelectedFiles(prev => {
              const newFiles = [...prev];
              newFiles[index] = { ...newFiles[index], progress };
              return newFiles;
            });
          });

          completedUploads++;
          setOverallProgress((completedUploads * 100) / totalFiles);

          setSelectedFiles(prev => {
            const newFiles = [...prev];
            newFiles[index] = { ...newFiles[index], uploading: false, progress: 100 };
            return newFiles;
          });
        } catch (error) {
          console.error('Error uploading file:', selectedFile.file.name, error);
          setSelectedFiles(prev => {
            const newFiles = [...prev];
            newFiles[index] = { 
              ...newFiles[index], 
              error: error.message, 
              uploading: false 
            };
            return newFiles;
          });
          continue;
        }
      }

      if (completedUploads === totalFiles) {
        toast.success('All images uploaded successfully');
        setSelectedFiles([]);
        setOverallProgress(0);
        loadInitialData();
      } else if (completedUploads > 0) {
        toast.success(`${completedUploads} of ${totalFiles} images uploaded successfully`);
        loadInitialData();
      } else {
        toast.error('No images were uploaded successfully');
      }
    } catch (error) {
      console.error('Upload failed:', error);
      toast.error('Failed to upload images');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (imageId) => {
    if (!window.confirm('Are you sure you want to delete this image?')) return;
    
    try {
      await deleteGalleryImage(imageId);
      toast.success('Image deleted successfully');
      loadInitialData();
    } catch (error) {
      toast.error('Error deleting image');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <span className="ml-2 text-lg">Loading gallery...</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Gallery Management</h1>

      {/* Image Details */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Image Details</h2>
          <div className="flex items-center gap-2">
            <span className={`text-sm ${uploadMode === 'matchday' ? 'text-gray-900' : 'text-gray-500'}`}>
              Matchday
            </span>
            <button
              onClick={() => setUploadMode(prev => prev === 'matchday' ? 'teams' : 'matchday')}
              type="button"
              className={`
                relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent 
                transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                ${uploadMode === 'teams' ? 'bg-blue-500' : 'bg-gray-200'}
              `}
              role="switch"
              aria-checked={uploadMode === 'teams'}
            >
              <span
                aria-hidden="true"
                className={`
                  pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 
                  transition duration-200 ease-in-out
                  ${uploadMode === 'teams' ? 'translate-x-5' : 'translate-x-0'}
                `}
              />
            </button>
            <span className={`text-sm ${uploadMode === 'teams' ? 'text-gray-900' : 'text-gray-500'}`}>
              Teams
            </span>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {uploadMode === 'teams' ? (
            <>
              <div>
                <label className="block text-sm font-medium mb-1">Home Team</label>
                <select
                  value={metadata.team1}
                  onChange={(e) => setMetadata({ ...metadata, team1: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                >
                  <option value="">Select Home Team</option>
                  {teams.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Away Team</label>
                <select
                  value={metadata.team2}
                  onChange={(e) => setMetadata({ ...metadata, team2: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                >
                  <option value="">Select Away Team</option>
                  {teams.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name}
                    </option>
                  ))}
                </select>
              </div>
            </>
          ) : null}
          <div className={uploadMode === 'matchday' ? 'md:col-span-3' : ''}>
            <label className="block text-sm font-medium mb-1">Matchday</label>
            <select
              value={metadata.matchday}
              onChange={(e) => setMetadata({ ...metadata, matchday: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
              required
            >
              <option value="">Select Matchday</option>
              {matchdays.map((matchday) => (
                <option key={matchday.id} value={matchday.id}>
                  Jornada {matchday.number} {matchday.phase ? `(${matchday.phase})` : ''}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Drop Zone */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 mb-6 text-center cursor-pointer transition-colors
          ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}`}
      >
        <input {...getInputProps()} />
        <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
        <p className="text-lg text-gray-600">
          {isDragActive
            ? 'Drop the images here...'
            : 'Drag & drop images here, or click to select files'}
        </p>
        <p className="text-sm text-gray-500 mt-2">
          Supported formats: JPEG, PNG, WebP
        </p>
      </div>

      {/* Selected Files Preview */}
      {selectedFiles.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-4">Selected Images</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {selectedFiles.map((file, index) => (
              <div key={index} className="relative group">
                <img
                  src={file.preview}
                  alt={`Preview ${index + 1}`}
                  className="w-full aspect-video object-cover rounded-lg"
                />
                <button
                  onClick={() => removeSelectedFile(index)}
                  className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-4 h-4" />
                </button>
                {file.uploading && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex flex-col items-center justify-center rounded-lg">
                    <Loader2 className="w-8 h-8 animate-spin text-white mb-2" />
                    <div className="w-3/4 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${file.progress || 0}%` }}
                      />
                    </div>
                    <p className="text-white text-sm mt-1">{file.progress || 0}%</p>
                  </div>
                )}
                {file.progress === 100 && !file.error && !file.uploading && (
                  <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center rounded-lg">
                    <div className="bg-green-500 rounded-full p-2">
                      <svg 
                        className="w-6 h-6 text-white" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          strokeWidth={2} 
                          d="M5 13l4 4L19 7" 
                        />
                      </svg>
                    </div>
                  </div>
                )}
                {file.error && (
                  <div className="absolute inset-0 bg-red-500 bg-opacity-50 flex items-center justify-center rounded-lg">
                    <div className="text-center px-4">
                      <svg 
                        className="w-8 h-8 text-white mx-auto mb-2" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          strokeWidth={2} 
                          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
                        />
                      </svg>
                      <p className="text-white text-sm">{file.error}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Overall Progress */}
          {uploading && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-700">Overall Progress</span>
                <span className="text-sm font-medium text-gray-700">{Math.round(overallProgress)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-blue-500 h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${overallProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Upload Button */}
          <button
            onClick={handleUpload}
            disabled={uploading}
            className={`mt-4 px-6 py-2 rounded-lg text-white font-medium flex items-center justify-center
              ${uploading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-500 hover:bg-blue-600'
              }`}
          >
            {uploading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-5 h-5 mr-2" />
                Upload Images
              </>
            )}
          </button>
        </div>
      )}

      {/* Uploaded Images Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Object.entries(
          images.reduce((groups, image) => {
            const matchKey = `${image.expand?.team1?.name}_${image.expand?.team2?.name}`;
            if (!groups[matchKey]) {
              groups[matchKey] = {
                images: [],
                team1: image.expand?.team1?.name,
                team2: image.expand?.team2?.name,
                preview: image,
                matchdays: new Set()
              };
            }
            groups[matchKey].images.push(image);
            if (image.expand?.matchday?.number) {
              groups[matchKey].matchdays.add(image.expand.matchday.number);
            }
            return groups;
          }, {})
        ).sort((a, b) => {
          const aLatest = new Date(a[1].preview.created);
          const bLatest = new Date(b[1].preview.created);
          return bLatest - aLatest;
        }).map(([matchKey, match]) => (
          <div key={matchKey} className="bg-white rounded-lg shadow-md overflow-hidden">
            <div 
              className="aspect-video relative group cursor-pointer"
              onClick={() => setExpandedMatch(expandedMatch === matchKey ? null : matchKey)}
            >
              {match.preview.image ? (
                <img
                  src={pb.getFileUrl(match.preview, match.preview.image)}
                  alt="Match Preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-100">
                  <ImageIcon className="w-12 h-12 text-gray-400" />
                </div>
              )}
              <div className="absolute inset-0 bg-black bg-opacity-30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <span className="text-white text-xl font-semibold">
                  {match.images.length} {match.images.length === 1 ? 'photo' : 'photos'}
                </span>
              </div>
            </div>
            <div className="p-4">
              <h3 className="text-lg font-semibold mb-1">
                {match.team1} vs {match.team2}
              </h3>
              <div className="mt-3 flex justify-between items-center">
                <span className="text-sm text-gray-500">
                  {match.images.length} {match.images.length === 1 ? 'photo' : 'photos'} •{' '}
                  {match.matchdays.size > 0 && 
                    `${match.matchdays.size} matchday${match.matchdays.size > 1 ? 's' : ''}`
                  }
                </span>
                <button
                  onClick={() => {
                    if (window.confirm(`Are you sure you want to delete all ${match.images.length} photos between these teams?`)) {
                      Promise.all(match.images.map(img => handleDelete(img.id)));
                    }
                  }}
                  className="text-red-500 hover:text-red-600 flex items-center gap-1 text-sm"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete All
                </button>
              </div>
            </div>

            {/* Expanded view of all photos */}
            {expandedMatch === matchKey && (
              <div className="border-t border-gray-200 p-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {match.images.map((image) => (
                    <div key={image.id} className="relative group">
                      <img
                        src={pb.getFileUrl(image, image.image)}
                        alt={`${image.expand?.team1?.name} vs ${image.expand?.team2?.name}`}
                        className="w-full aspect-video object-cover rounded-lg"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity duration-300 flex items-center justify-center">
                        <button
                          onClick={() => {
                            if (window.confirm('Are you sure you want to delete this photo?')) {
                              handleDelete(image.id);
                            }
                          }}
                          className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 p-2">
                        <p className="text-white text-xs">
                          Jornada {image.expand?.matchday?.number}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminGallery; 
