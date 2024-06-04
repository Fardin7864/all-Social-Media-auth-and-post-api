const express = require('express');
const session = require('express-session');
const passport = require('passport');
const TwitterStrategy = require('passport-twitter').Strategy;
require('dotenv').config();

const app = express();

// Session middleware
app.use(session({ secret: process.env.SESSION_SECRET, resave: false, saveUninitialized: true }));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((obj, done) => {
  done(null, obj);
});

// Twitter strategy
passport.use(new TwitterStrategy({
  consumerKey: process.env.TWITTER_CONSUMER_KEY,
  consumerSecret: process.env.TWITTER_CONSUMER_SECRET,
  callbackURL: process.env.TWITTER_CALLBACK_URL
},
(token, tokenSecret, profile, done) => {
  return done(null, { profile, token, tokenSecret });
}));

// Routes
app.get('/auth/twitter', passport.authenticate('twitter'));

app.get('/auth/twitter/callback',
  passport.authenticate('twitter', { failureRedirect: '/' }),
  (req, res) => {
    res.redirect('/tweet');
  }
);

app.get('/tweet', (req, res) => {
  if (!req.isAuthenticated()) {
    return res.redirect('/auth/twitter');
  }
  res.send('<form action="/tweet" method="POST"><textarea name="tweet"></textarea><button type="submit">Post Tweet</button></form>');
});

app.post('/tweet', (req, res) => {
  if (!req.isAuthenticated()) {
    return res.redirect('/auth/twitter');
  }

  const { token, tokenSecret } = req.user;
  const tweet = req.body.tweet;

  const url = 'https://api.twitter.com/1.1/statuses/update.json';
  const params = { status: tweet };

  axios.post(url, params, {
    headers: {
      'Authorization': `OAuth oauth_consumer_key="${process.env.TWITTER_CONSUMER_KEY}", oauth_token="${token}", oauth_signature_method="HMAC-SHA1", oauth_timestamp="${Math.floor(Date.now() / 1000)}", oauth_nonce="${Math.random().toString(36).substring(2)}", oauth_version="1.0", oauth_signature="your_signature"`
    }
  })
  .then(response => {
    res.send('Tweet posted successfully');
  })
  .catch(error => {
    console.error(error);
    res.send('Error posting tweet');
  });
});

app.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});
