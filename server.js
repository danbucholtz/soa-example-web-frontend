var express = require("express");
var http = require("http");
var passport = require("passport");

var BearerStrategy = require("passport-http-bearer").Strategy;
var BasicStrategy = require("passport-http").BasicStrategy;
var LocalStrategy = require("passport-local").Strategy;

var authenticationService = require("soa-example-authentication-service-api");
var authorizationService = require("soa-example-authorization-service-api");
var bannedIpService = require("soa-example-banned-ip-service-api");
var userServiceApi = require("soa-example-user-service-api");

var categoryController = require('./controllers/CategoryController');
var productController = require('./controllers/ProductController');

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
                return done(null, false, {type: "local", username: username, password: password, message: "Unknown User: " + username} );
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

passport.use(new BearerStrategy({}, function(token, done) {
    process.nextTick(function () {

        userServiceApi.getUserByToken(token).then(function(user){
            if ( !user ){
                return done(null, false, {type: "bearer", token: token, message: "Unknown access token: " + token});
            }
            return done(null, user);
        });
    });
}));

passport.use(new BasicStrategy({}, function(username, password, done) {
    process.nextTick(function () {
        authenticationService.authenticateUserByEmailAddressAndPassword(username, password).then(function(response){
            if ( !response.success ){
                return done(null, false, {type: "basic", username: username, password: password, message: "Unknown User: " + username} );
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
    app.set("port", process.env.PORT || 3000  );
    app.use(express.logger("dev"));
    app.use(express.bodyParser({uploadDir:"./uploads", limit: "50mb"}));
    app.use(express.json({limit: "50mb"}));
    app.use(express.urlencoded({limit: "50mb"}));
    app.use(express.methodOverride());
    app.use(express.cookieParser("asd;lfkajs;ldfkj"));
    app.use(express.session({
        secret: "banana",
        maxAge  : new Date(Date.now() + 360000000),
        expires : new Date(Date.now() + 360000000)
    }));
    app.set("views", __dirname + "/views");
    app.set("view engine", "ejs");
    app.engine("html", require("ejs").renderFile);
    app.use(express.static(__dirname + "/public"));
    app.use(passport.initialize());
    app.use(passport.session());
    app.use(app.router);
});

http.createServer(app).listen(app.get("port"), function(){
  console.log("Node is starting up");
  console.log("Express server listening on port " + app.get("port"));
});

app.get("/api/categories", ensureAuthenticated, categoryController.getCategories);
app.get("/api/categories/:id", ensureAuthenticated, categoryController.getCategoryById);
app.post("/api/categories", ensureAuthenticated, categoryController.createCategory);
app.get("/api/products", ensureAuthenticated, productController.getProducts);
app.get("/api/products/:id", ensureAuthenticated, productController.getProductById);
app.post("/api/products", ensureAuthenticated, productController.createProduct);

app.get("/authenticated", ensureAuthenticated, function(req, res){
    res.render("protected", { user: req.user });
});

app.get("/protectedTwo", ensureAuthenticated, function(req, res){
    res.render("protectedTwo");
});

app.get("/logout", function(req, res){
    req.logout();
    res.redirect("/");
});

app.get("/login", function(req, res){
    res.render("login", { user: req.user });
});

app.get("/register", function(req, res){
    res.render("register", { user: req.user });
});

app.post("/register", function(req, res){
    var emailAddresss = req.body.emailAddress;
    var password = req.body.password;

    userService.createUser(emailAddresss, password).then(function(user){
        res.redirect("/");
    });
});

app.post("/login", doLocalAuthentication, function(req, res) {
    res.redirect("/authenticated");
});

app.get("/", function(req, res){
    res.render("landing", { user: req.user });
});

function doLocalAuthentication(req, res, next){
    if ( req.isAuthenticated() ){
        return next();
    }
    // check if the ip address making request is banned
    var ipAddress = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
    bannedIpService.isIpAddressBanned(ipAddress).then(function(banned){
        if ( banned ){
            res.statusCode = 401;
            res.send({success:false, errorMessage:"This IP Address is temporarily banned.  Try again later."});
            next("This IP Address is temporarioy banned.  Try again later.");
        }
        else{
            passport.authenticate("local", { }, function (err, user, message){
                if ( user ){
                    req.user = user;
                    return next();
                }
                else{
                    bannedIpService.invalidBasicCredentials(ipAddress, message.username, message.password);
                    res.redirect("/login");
                }
            })(req, res, next);
        }
    });
};

function ensureAuthenticated(req, res, next) {
    if ( req.isAuthenticated() ){
        return next();
    }
    
    // check if the ip address making request is banned
    var ipAddress = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
    bannedIpService.isIpAddressBanned(ipAddress).then(function(banned){
        if ( banned ){
            res.statusCode = 401;
            res.send({success:false, errorMessage:"This IP Address is temporarily banned.  Try again later."});
            next("This IP Address is temporarioy banned.  Try again later.");
        }
        else{
            // start checkinging headers for authentication
            if ( req.headers && req.headers.authorization && req.headers.authorization.indexOf("Basic ") >= 0 ){
                // support basic, too
                passport.authenticate("basic", { session: false }, function(err, user, message){
                    if (user) {
                        req.user = user;
                        return next();
                    }
                    else{
                        bannedIpService.invalidBasicCredentials(ipAddress, message.username, message.password);
                        res.statusCode = 401;
                        res.send({success: false, errorMessage:"Valid User Credentials are required for Basic authentication"});
                        next("Valid User Credentials are required");
                    }
                })(req, res, next);
            }
            else if ( req.headers && req.headers.authorization && req.headers.authorization.indexOf("Bearer ") >= 0 ){
                passport.authenticate("bearer", { session: false }, function (err, user, message) {
                    if (user) {
                        req.user = user;
                        return next();
                    }
                    else{
                        bannedIpService.invalidBearerCredentials(ipAddress, message.token);
                        res.statusCode = 401;
                        res.send({success: false, errorMessage:"A Valid Bearer Token is required"});
                        next("A Valid Bearer Token is required");
                    }
                })(req, res, next);
            }
            else{
                res.statusCode = 401;
                res.send({success: false, errorMessage:"A Bearer Token is required"});
                next("Missing Bearer Token");
            }
        }
    });
};