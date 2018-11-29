var express = require('express');
var router = express.Router();
var Photos = require('../models/photos');
// Get Homepage
router.get('/', function(req, res){
	Photos.find({},['username', 'path','caption','time'], {sort:{_id:-1}}, function(err, photos){
		if(err) console.log(err);
		res.render('index', { photolist:photos});
	});
});



module.exports = router;