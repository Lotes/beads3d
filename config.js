var path = require('path');

var VOXELIFY_PATH = path.join(__dirname, 'voxelify');

module.exports = {
  DEVELOPMENT_SESSION: 'development',
  DEVELOPMENT_DATA_PATH: path.join(__dirname, 'development'),
  SESSIONS_PATH: path.join(__dirname, 'sessions'),
  TEMP_PATH: path.join(__dirname, 'temp'),
  MAX_SPACE_PER_SESSION: 10*1024*1024,
  VOXELIFY_PATH: VOXELIFY_PATH,
  VOXELIFY_EXECUTABLE_PATH: path.join(VOXELIFY_PATH, 'voxelify'),
  UNPACKER_EXECUTABLE_PATH: path.join(VOXELIFY_PATH, 'zip2obj')
};