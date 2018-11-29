var mongoose = require('mongoose');

var photoSchema=mongoose.Schema({
  username : {type:String},
  path:  { type: String },
  caption: { type: String },
  time: {type: Date}
  });

var Photos = module.exports = mongoose.model('Photos', photoSchema);