var path = require('path');

var TOOLS_PATH = path.join(__dirname, 'tools', 'bin');

module.exports = {
  SESSION_SECRET: 'keyboard cat',
  SESSION_MAX_AGE: 365 * 24 * 60 * 60 * 1000, //one year
  
  GOOGLE_PLUS_CLIENT_ID: process.env.GOOGLE_PLUS_CLIENT_ID,
  GOOGLE_PLUS_CLIENT_SECRET: process.env.GOOGLE_PLUS_CLIENT_SECRET,
  
  UPLOADS_PATH: path.join(__dirname, 'uploads'),
  TEMP_PATH: path.join(__dirname, 'temp'),
  MAX_SPACE_PER_USER: 0.3 * 1024 * 1024, //0.3 MiB
  
  DEVELOPMENT_DATA_PATH: path.join(__dirname, 'development'),
  TOOLS_PATH: TOOLS_PATH,
  VOXELIFY_EXECUTABLE_PATH: path.join(TOOLS_PATH, 'voxelify'),
  UNPACKER_EXECUTABLE_PATH: path.join(TOOLS_PATH, 'zip2obj')
};