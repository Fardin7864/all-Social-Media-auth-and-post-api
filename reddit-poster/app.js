const express = require('express');
const axios = require('axios');
const qs = require('querystring');
const dotenv = require('dotenv');
const multer = require('multer');
const path = require('path');
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware to parse JSON bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Set up the view engine to use EJS
app.set('view engine', 'ejs');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

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

app.post('/post', async (req, res) => {
    const { title, content, url } = req.body;

    try {
        // Determine the type of post based on presence of content or url
        const kind = url ? 'link' : 'self';
        const postData = {
            sr: 'test', // Replace 'test' with the subreddit you want to post to
            kind: kind,
            title: title,
        };

        if (kind === 'self') {
            postData.text = content;
        } else {
            postData.url = url;
        }

        const response = await axios.post('https://oauth.reddit.com/api/submit', qs.stringify(postData), {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });
        
        console.log(response.data);
        res.send('Post created successfully!');
    } catch (error) {
        res.send('Error creating post: ' + error.message);
    }
});

// Route to handle post creation (image)
app.post('/post-image', upload.single('image'), async (req, res) => {
    const { title } = req.body;
    const imagePath = req.file.path;

    try {
        const imageUploadResponse = await axios.post('https://oauth.reddit.com/api/submit', qs.stringify({
            sr: 'test', // Replace 'test' with the subreddit you want to post to
            kind: 'image',
            title: title,
            url: `http://localhost:${port}/${imagePath}` // Assuming you will serve the image from your server
        }), {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });
        console.log(imageUploadResponse.data);
        res.send('Image post created successfully!');
    } catch (error) {
        res.send('Error creating image post: ' + error.message);
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
