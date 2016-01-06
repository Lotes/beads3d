var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var connection = mongoose.connect('mongodb://localhost/beads3d'); //TODO magic string

var SessionSchema = new Schema({
  cookie: { type: String, index: { unique: true }},
  lastAccessAt: { type: Date, 'default': Date.now }
});

var ImageSchema = new Schema({
  fileName: String,
  session: String
});

var ModelSchema = new Schema({
  fileName: String,
  session: String
});

var StarSchema = new Schema({
  image: String,
  session: String,
  timestamp: Date,
  valid: Boolean
});

var ViewSchema = new Schema({
  image: String,
  session: String,
  timestamp: Date
});

module.exports = {
  Session: connection.model('sessions', SessionSchema),
  Image: connection.model('images', ImageSchema),
  Model: connection.model('models', ModelSchema),
  Star: connection.model('stars', StarSchema),
  View: connection.model('views', ViewSchema)
};