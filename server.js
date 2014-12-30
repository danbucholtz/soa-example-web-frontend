var express = require('express');
var http = require('http');
var passport = require('passport');

// AUTH
var LocalStrategy = require('passport-local').Strategy;

var userService = require("soa-example-user-service-api");
var authenticationService = require("soa-example-authentication-service-api");
var authorizationService = require("soa-example-authorization-service-api");

// Passport session setup.
// To support persistent login sessions, Passport needs to be able to
// serialize users into and deserialize users out of the session.
passport.serializeUser(function(user, done) {
	done(null, user);
});

passport.deserializeUser(function(obj, done) {
	done(null, obj);
});

passport.use(new LocalStrategy(function(username, password, done) {
    // asynchronous verification, for effect...
	process.nextTick(function () {

		authenticationService.authenticateUserByEmailAddressAndPassword(username, password).then(function(response){
			if ( !response.success ){
				return done(null, false, {message: "Unknown User: " + username} );
      		}
      		var user = response.user;
      		authorizationService.getPermissions(user.accessToken).then(function(permissions){
      			user.permissions = permissions;
      			return done (null, user);
      		}, function(err){
      			return done(null, false, { message: err.toString() });
      		});
		});

    });
}));

var app = express();


app.configure(function(){
	app.set('port', process.env.PORT || 3000  );
	app.use(express.logger('dev'));
	app.use(express.bodyParser({uploadDir:'./uploads', limit: '50mb'}));
	app.use(express.json({limit: '50mb'}));
	app.use(express.urlencoded({limit: '50mb'}));
	app.use(express.methodOverride());
	app.use(express.cookieParser('asd;lfkajs;ldfkj'));
	app.use(express.session({
		secret: 'banana',
		maxAge  : new Date(Date.now() + 360000000),
		expires : new Date(Date.now() + 360000000)
	}));
	app.set('views', __dirname + '/views');
	app.set('view engine', 'ejs');
	app.engine('html', require('ejs').renderFile);
	app.use(express.static(__dirname + '/public'));
	app.use(passport.initialize());
	app.use(passport.session());
	app.use(app.router);
});

http.createServer(app).listen(app.get('port'), function(){
  console.log('Node is starting up');
  console.log('Express server listening on port ' + app.get('port'));
});

app.get('/authenticated', ensureAuthenticated, function(req, res){
	res.render('protected', { user: req.user });
});

app.get('/protectedTwo', ensureAuthenticated, function(req, res){
	res.render('protectedTwo');
});

app.get('/logout', function(req, res){
	req.logout();
	res.redirect('/');
});

app.get('/login', function(req, res){
    res.render('login', { user: req.user });
});

app.get('/register', function(req, res){
    res.render('register', { user: req.user });
});

app.post('/register', function(req, res){
    var emailAddresss = req.body.emailAddress;
    var password = req.body.password;

    userService.createUser(emailAddresss, password).then(function(user){
    	res.redirect("/");
    });
});

app.post('/login', passport.authenticate('local', { failureRedirect: '/login' }), function(req, res) {
	res.redirect("/authenticated");
});

app.get('/', function(req, res){
    res.render('landing', { user: req.user });
});

// Simple route middleware to ensure user is authenticated.
//   Use this route middleware on any resource that needs to be protected.  If
//   the request is authenticated (typically via a persistent login session),
//   the request will proceed.  Otherwise, the user will be redirected to the
//   login page.
function ensureAuthenticated(req, res, next) {
	if (req.isAuthenticated()) {
		return next();
	}
	else {
		res.redirect('/login')
	}
}
