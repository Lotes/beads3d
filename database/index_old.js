var Q = require('q');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var connection = mongoose.connect('mongodb://localhost/beads3d'); //TODO magic string

var SessionSchema = new Schema({
  cookie: { type: String, index: { unique: true }},
  lastAccessAt: { type: Date, 'default': Date.now }
});

var ImageSchema = new Schema({
  name: { type: String, index: { unique: true } }, //==file name in images directory
  description: String,
  createdAt: { type: Date, 'default': Date.now },
  width: Number,
  height: Number,
  length: Number,
  colors: [{
    hex: String,
    count: Number
  }],
  tags: [{ type: String, index: true }],
  parent: { type: Schema.ObjectId, ref: 'images' },
  session: { type: Schema.ObjectId, ref: 'sessions' }
});

var UploadSchema = new Schema({
  session: { type: Schema.ObjectId, ref: 'sessions' },
  name: { type: String }, //==folder "sessions/{SESSIONID}/{name}"
  uploadedAt: { type: Date, 'default': Date.now },
  size: Number
});

var StarSchema = new Schema({
  image: { type: Schema.ObjectId, ref: 'images' },
  session: { type: Schema.ObjectId, ref: 'sessions' },
  timestamp: Date,
  valid: Boolean
});

var ViewSchema = new Schema({
  image: { type: Schema.ObjectId, ref: 'images' },
  session: { type: Schema.ObjectId, ref: 'sessions' },
  timestamp: Date
});

module.exports = {
  Session: connection.model('sessions', SessionSchema),
  Image: connection.model('images', ImageSchema),
  Upload: connection.model('uploads', UploadSchema),
  Star: connection.model('stars', StarSchema),
  View: connection.model('views', ViewSchema)
};