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


router.get('/editphoto', function(req,res){
	Photos.findById(req.query.id, function(err, photos){
		if(err){
			console.log(err);
		}
		res.render('edit', {path:photos.path, caption:photos.caption, _id:photos._id});
	});
});

router.post('/editphoto', function(req, res){
	var query = {"id": req.query.id};
	var caption = req.body.caption;
	console.log(query, caption);
	Photos.findOneAndUpdate(query, {$set:{"caption":caption}}, {new:true}, function(err, photos){
		if (err){
			console.log(err);
		}
		console.log(photos);
		res.redirect('/');
	});
});


module.exports = router;