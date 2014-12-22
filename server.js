var express = require('express');
var http = require('http');
var passport = require('passport');

// AUTH
var LocalStrategy = require('passport-local').Strategy;

// Passport session setup.
// To support persistent login sessions, Passport needs to be able to
// serialize users into and deserialize users out of the session.
passport.serializeUser(function(user, done) {
	User.findOne({dropboxId: user.id}, function(err, dbuser){
		if (!user  || err) {
			done(null, user);
		}
		else{
			done(null, dbuser);
		}
	});
});

passport.deserializeUser(function(obj, done) {
	done(null, obj);
});

// Dropbox OAuth2 Strategy
passport.use(new DropboxOAuth2Strategy({
		clientID: config.dropbox.appKey,
		clientSecret: config.dropbox.appSecret,
		callbackURL: config.dropbox.callbackURL,
		passReqToCallback: true
	},
	function(req, accessToken, refreshToken, profile, done) {
		process.nextTick(function () {
            // save user to database
            var dropboxId = profile.id;
            var dropboxToken = User.encryptDropboxToken(accessToken);
            var emailAddress = profile.emails[0].value;
            // for mobile login we re-generate username and password
            userController.createOrUpdateUser(dropboxId, dropboxToken, emailAddress, req.session.loginMobile, function(err, userEntity, clearTextUsername, clearTextPassword){
                if ( err ){
                    return done(err);
                }
                else {
                    if (req.session.loginMobile) {
                        // store the clear text username and password in the session for mobile login
                        req.session.loginMobileUsername = clearTextUsername;
                        req.session.loginMobilePassword = clearTextPassword;
                    }
					return done(null, profile);
                }
            });
		});
	}
));

passport.use(new BasicStrategy({
	},
	function(username, password, done) {
		process.nextTick(function () {
			User.findOne({generatedUsername: User.hashUsername(username), generatedPassword: User.hashPassword(password)}, function (err, user) {
				if (err) {
					return done(err);
				}
				else if (!user) {
					return done(null, false);
				}
				else {
					return done(null, user);
				}
			});
		});
	}
));

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

// Dropbox Auth Routes
app.get('/auth/dropbox',
	passport.authenticate('dropbox-oauth2'),
	function(req, res){
		// The request will be redirected to Dropbox for authentication, so this
		// function will not be called.
	}
);

app.get('/auth/dropbox/callback',
	passport.authenticate('dropbox-oauth2', { failureRedirect: '/login' }),
	function(req, res) {
        if (req.session.loginMobile) {
            // at this point the user object in the req is the dropbox user, so user.id = dropboxId in our db
            userController.getUserByDropboxId(req.user.id, function(err,user) {
                if (!err && user) {
                    res.redirect("/mobileAuth?u=" + req.session.loginMobileUsername + "&p=" + req.session.loginMobilePassword);
                }
                else {
                    res.redirect("/app");
                }
            });
        }
        else {
            res.redirect("/app");
        }
	}
);

http.createServer(app).listen(app.get('port'), function(){
  console.log('Node is starting up');
  console.log('Express server listening on port ' + app.get('port'));
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
