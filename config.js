var path = require('path');

module.exports = {
  DEVELOPMENT_SESSION: 'development',
  DEVELOPMENT_DATA_PATH: path.join(__dirname, 'development'),
  MODELS_PATH: path.join(__dirname, 'models'),
  MODEL_NAME_LENGTH: 20,
  MODELS_MAX_SPACE_PER_SESSION: 10*1024*1024,
  BEADIFIER_PATH: path.join(__dirname, 'voxelify'),
  BEADIFIER_EXECUTABLE_PATH: path.join(__dirname, 'voxelify', 'voxelify')
};