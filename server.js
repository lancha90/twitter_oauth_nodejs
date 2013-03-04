var express = require('express');
var sys     = require('sys');
var oauth   = require('oauth');
var app     = express(),
server  = require('http').createServer(app);


// Configuration of values aplication twitter
var _twitterConsumerKey = "PD4vj1rLarjmVe6HmSZ7XQ";
var _twitterConsumerSecret = "jBhOCrFsqxhloWhWjilnAZ2YEMQ5d4Mcg6dX051Yk";

//"http://localhost:3000/sessions/callback" change to your url callback
function consumer() {
  return new oauth.OAuth(
    "https://twitter.com/oauth/request_token", "https://twitter.com/oauth/access_token", 
    _twitterConsumerKey, _twitterConsumerSecret, "1.0A", "http://localhost:3000/sessions/callback", "HMAC-SHA1");   
}


// Configuration express
app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
  app.use(express.logger());
  app.use(express.cookieParser('thissecretrocks'));
  app.use(express.session({ secret: 'thissecretrocks', cookie: { maxAge: 60000 } }));
  app.use(function(req, res, next){
    res.locals.user = req.session.user;
    next();
  });

});

app.get('/', function(req, res){
  res.send('Hello World');
});

//page that redirect to twitter authentication
app.get('/sessions/connect', function(req, res){
  consumer().getOAuthRequestToken(function(error, oauthToken, oauthTokenSecret, results){
    if (error) {
      res.send("Error getting OAuth request token : " + sys.inspect(error), 500);
    } else {  
      req.session.oauthRequestToken = oauthToken;
      req.session.oauthRequestTokenSecret = oauthTokenSecret;
      res.redirect("https://twitter.com/oauth/authorize?oauth_token="+req.session.oauthRequestToken);      
    }
  });
});


//page callback after twitter authentication
app.get('/sessions/callback', function(req, res){
  sys.puts(">>"+req.session.oauthRequestToken);
  sys.puts(">>"+req.session.oauthRequestTokenSecret);
  sys.puts(">>"+req.query.oauth_verifier);
  consumer().getOAuthAccessToken(req.session.oauthRequestToken, req.session.oauthRequestTokenSecret, req.query.oauth_verifier, function(error, oauthAccessToken, oauthAccessTokenSecret, results) {
    if (error) {
      res.send("Error getting OAuth access token : " + sys.inspect(error) + "["+oauthAccessToken+"]"+ "["+oauthAccessTokenSecret+"]"+ "["+sys.inspect(results)+"]", 500);
    } else {
      req.session.oauthAccessToken = oauthAccessToken;
      req.session.oauthAccessTokenSecret = oauthAccessTokenSecret;
      // Right here is where we would write out some nice user stuff
      
      consumer().get("https://api.twitter.com/1.1/account/verify_credentials.json", req.session.oauthAccessToken, req.session.oauthAccessTokenSecret, function (error, data, response) {
        if (error) {          
          res.send("Error getting twitter screen name : " + sys.inspect(error), 500);
        } else {
          console.log("data is %j", data);
          data = JSON.parse(data);
          req.session.twitterScreenName = data["screen_name"];    
          res.send('You are signed in: ' + req.session.twitterScreenName)
        }  
      });  

    }
  });
});


app.listen(3000);