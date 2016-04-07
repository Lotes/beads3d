var path = require('path');

var VOXELIFY_PATH = path.join(__dirname, 'tools', 'bin');

module.exports = {
  SESSION_SECRET: 'keyboard cat',
  SESSION_MAX_AGE: 24 * 60 * 60 * 1000, //one day
  
  GOOGLE_PLUS_CLIENT_ID: process.env.GOOGLE_PLUS_CLIENT_ID,
  GOOGLE_PLUS_CLIENT_SECRET: process.env.GOOGLE_PLUS_CLIENT_SECRET,
  
  DEVELOPMENT_SESSION: 'development',
  DEVELOPMENT_DATA_PATH: path.join(__dirname, 'development'),
  SESSIONS_PATH: path.join(__dirname, 'sessions'),
  TEMP_PATH: path.join(__dirname, 'temp'),
  MAX_SPACE_PER_SESSION: 10*1024*1024,
  VOXELIFY_PATH: VOXELIFY_PATH,
  VOXELIFY_EXECUTABLE_PATH: path.join(VOXELIFY_PATH, 'voxelify'),
  UNPACKER_EXECUTABLE_PATH: path.join(VOXELIFY_PATH, 'zip2obj')
};