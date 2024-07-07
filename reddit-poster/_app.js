const express = require('express');
const axios = require('axios');
const qs = require('querystring');
const dotenv = require('dotenv');
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware to parse JSON bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Set up the view engine to use EJS
app.set('view engine', 'ejs');

// Replace these with your Reddit app details
const clientId = process.env.REDDIT_CLIENT_ID;
const clientSecret = process.env.REDDIT_CLIENT_SECRET;
const redirectUri = process.env.REDDIT_REDIRECT_URI;

let accessToken = '';

// Route to render the home page
app.get('/', (req, res) => {
    res.render('index', { accessToken });
});

// Route to handle Reddit login
app.get('/login', (req, res) => {
    const state = 'random_string'; // You should use a random string for the state parameter
    const authUrl = `https://www.reddit.com/api/v1/authorize?` +
        `client_id=${clientId}&response_type=code&state=${state}` +
        `&redirect_uri=${redirectUri}&duration=temporary&scope=submit identity`;

    res.redirect(authUrl);
});

// Route to handle Reddit callback
app.get('/callback', async (req, res) => {
    const { code } = req.query;

    const tokenUrl = 'https://www.reddit.com/api/v1/access_token';
    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    try {
        const response = await axios.post(tokenUrl, qs.stringify({
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: redirectUri,
        }), {
            headers: {
                Authorization: `Basic ${auth}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        accessToken = response.data.access_token;
        res.redirect('/');
    } catch (error) {
        res.send('Error obtaining access token: ' + error.message);
    }
});

// Route to handle post creation
app.post('/post', async (req, res) => {
    const { title, content } = req.body;

    try {
        const response = await axios.post('https://oauth.reddit.com/api/submit', qs.stringify({
            sr: 'test', // Replace 'test' with the subreddit you want to post to
            kind: 'self',
            title: title,
            text: content
        }), {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });
        console.log(response.data)
        res.send('Post created successfully!');
    } catch (error) {
        res.send('Error creating post: ' + error.message);
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
