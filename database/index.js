var mongoose = require('mongoose');
var session = require('express-session');
var MongoStore = require('connect-mongo')(session);
var Schema = mongoose.Schema;

var TABLE_USER = 'User';
var TABLE_FOLLOW = 'Follow';
var TABLE_SESSION = 'Session';
var TABLE_UPLOAD = 'Upload';
var TABLE_MODEL = 'Model';
var TABLE_STAR = 'Star';

var connection = mongoose.connect('mongodb://localhost/beads3Dv2');

var UserSchema = new Schema({
  id: { type: String, index: { unique: true }},
  name: { type: String },
  photoUrl: { type: String }
});

var FollowSchema = new Schema({
  user: { type: Schema.ObjectId, ref: TABLE_USER },
  following: [{ type: Schema.ObjectId, ref: TABLE_USER }]
});

var UploadSchema = new Schema({
  owner: { type: Schema.ObjectId, ref: TABLE_USER },
  id: Number, //user-relative upload id
  name: String,
  folderName: String,
  files: [String],
  size: Number
});

var ModelSchema = new Schema({
  owner: { type: Schema.ObjectId, ref: TABLE_USER },
  createdAt: { type: Date, 'default': Date.now },
  parent: { type: Schema.ObjectId, ref: TABLE_MODEL },
  id: { type: String },
  description: { type: String },
  tags: [{ type: String }]
});

var StarSchema = new Schema({
  user: { type: Schema.ObjectId, ref: TABLE_USER },
  model: { type: Schema.ObjectId, ref: TABLE_MODEL }
});

module.exports = {
  User: connection.model(TABLE_USER, UserSchema),
  Follow: connection.model(TABLE_FOLLOW, FollowSchema),
  Upload: connection.model(TABLE_UPLOAD, UploadSchema),
  Model: connection.model(TABLE_MODEL, ModelSchema),
  Star: connection.model(TABLE_STAR, StarSchema),
  Connection: connection.connection
};