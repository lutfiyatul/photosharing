var express = require('express');
var router = express.Router();
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var upload = require('./upload')
var bcrypt = require('bcryptjs');
var User = require('../models/user');
var Photos = require('../models/photos');

// Register
router.get('/register', function (req, res) {
	res.render('register');
});

// Login
router.get('/login', function (req, res) {
	res.render('login');
});

// Register User
router.post('/register', function (req, res) {
	var email = req.body.email;
	var username = req.body.username;
	var password = req.body.password;
	var password2 = req.body.password2;

	// Validation
	req.checkBody('email', 'Email is required').notEmpty();
	req.checkBody('email', 'Email is not valid').isEmail();
	req.checkBody('username', 'Username is required').notEmpty();
	req.checkBody('password', 'Password is required').notEmpty();
	
	var errors = req.validationErrors();

	if (errors) {
		res.render('register', {
			errors: errors
		});
	}
	else {
		//checking for email and username are already taken
		User.findOne({ username: { 
			"$regex": "^" + username + "\\b", "$options": "i"
	}}, function (err, user) {
			User.findOne({ email: { 
				"$regex": "^" + email + "\\b", "$options": "i"
		}}, function (err, mail) {
				if (user || mail) {
					res.render('register', {
						user: user,
						mail: mail
					});
				}
				else {
					var newUser = new User({
						email: email,
						username: username,
						password: password
					});
					User.createUser(newUser, function (err, user) {
						if (err) throw err;
						console.log(user);
					});
         	req.flash('success_msg', 'You are registered and can now login');
					res.redirect('/users/login');
				}
			});
		});
	}
});

passport.use(new LocalStrategy(
	function (username, password, done) {
		User.getUserByUsername(username, function (err, user) {
			if (err) throw err;
			if (!user) {
				return done(null, false, { message: 'Unknown User' });
			}

			User.comparePassword(password, user.password, function (err, isMatch) {
				if (err) throw err;
				if (isMatch) {
					return done(null, user);
				} else {
					return done(null, false, { message: 'Invalid password' });
				}
			});
		});
	}));

passport.serializeUser(function (user, done) {
	done(null, user.id);
});

passport.deserializeUser(function (id, done) {
	User.getUserById(id, function (err, user) {
		done(err, user);
	});
});

router.post('/login',
	passport.authenticate('local', { successRedirect: '/', failureRedirect: '/users/login', failureFlash: true }),
	function (req, res) {
		res.redirect('/');
	});

router.get('/logout', function (req, res) {
	req.logout();

	req.flash('success_msg', 'You are logged out');

	res.redirect('/users/login');
});

router.get('/upload',ensureAuthenticated,  function(req, res){
	res.render("upload");
});

router.get('/profile', ensureAuthenticated, function(req, res){
	var user = req.user.username;
	var email = req.user.email;
	var password = req.user.password;
	res.render("profile",{user: user, email:email, password:password});
});

router.post('/update', function(req, res){
	var email = req.body.email;
	var username = req.body.username;
	var password = req.body.password;
	var password2 = req.body.password2;

	// Validation
	req.checkBody('email', 'Email is required').notEmpty();
	req.checkBody('email', 'Email is not valid').isEmail();
	req.checkBody('username', 'Username is required').notEmpty();
	req.checkBody('password', 'Password is required').notEmpty();
	
	var errors = req.validationErrors();

	if (errors) {
		res.render('profile', {
			errors: errors
		});
	}
	else {
		var newUser = new User({
			email: email,
			username: username,
			password: password
		});
		bcrypt.genSalt(10, function(err, salt) {
			bcrypt.hash(newUser.password, salt, function(err, hash) {
				newUser.password = hash;
				var query = {"username": req.user.username};
				User.findOneAndUpdate(query, {$set: {"username": newUser.username, "password":newUser.password, "email":newUser.email}}, {new:true}, function(err, user){
					if (err){
						console.log(err);
					}
					req.flash('success_msg', 'edited successfully');
					res.redirect('/users/profile');
				});
			});
		});
	}
});

router.post('/upload', function(req, res){
	upload(req, res, (error)=>{
		if(error){
			console.log(error);
			res.redirect('/users/upload');
		}else{
			if(req.file== undefined){
				res.redirect('/users/upload');
			}else{
				var fullPath = "files/"+req.file.filename;
	
				var document ={
					username: req.user.username,
					path: fullPath,
					caption: req.body.caption,
					time: new Date()
				};
				console.log(req.user.username);
				var photo = new Photos(document);
				photo.save(function(error){
					if(error){
						throw error;
					}
					res.redirect('/');
				});
			}
		}
	});
});

function ensureAuthenticated(req, res, next){
	if(req.isAuthenticated()){
		return next();
	} else {
		//req.flash('error_msg','You are not logged in');
		res.redirect('/users/login');
	}
}

router.get('/deletephoto', function(req, res){
	var id=req.query.id;
	Photos.findByIdAndRemove(id, function(err, photos){
		if (err){
			console.log(err);
		}
		res.redirect('/');
	});
});


module.exports = router;