const express = require('express');
const multer = require('multer');
const fs = require('fs');
const {google} = require('googleapis');
const {getAuthUrl, getOAuthClient} = require('./auth');

const app = express();
const upload = multer({ dest: 'uploads/' });

// Serve static files
app.use(express.static('public'));

app.get('/auth', (req, res) => {
    res.redirect(getAuthUrl());
});

app.get('/oauth2callback', async (req, res) => {
    const {code} = req.query;
    const oauth2Client = getOAuthClient();
    console.log("oauth 2 client on oauth2callback route:", oauth2Client)

    const {tokens} = await oauth2Client.getToken(code);
   const x = oauth2Client.setCredentials(tokens);
   console.log("oauth client cred:", x)
    res.redirect('/?authorized=true');
});

app.post('/upload', upload.single('video'), (req, res) => {
    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }

    const oauth2Client = getOAuthClient();
    console.log("oauth 2 client on upload:", oauth2Client)
    const youtube = google.youtube({
        version: 'v3',
        auth: oauth2Client
    });

    const {path, mimetype} = req.file;

    const requestData = {
        resource: {
            snippet: {
                title: 'Test Video',
                description: 'This is a test video uploaded via the YouTube API'
            },
            status: {
                privacyStatus: 'private' // or 'public' or 'unlisted'
            }
        },
        media: {
            body: fs.createReadStream(path)
        },
        part: 'snippet,status'
    };

    youtube.videos.insert(requestData, (err, data) => {
        if (err) {
            return res.status(400).send('Error uploading video: ' + err);
        }
        res.send('Video uploaded!');
    });
});

app.listen(3000, () => {
    console.log('Server started on http://localhost:3000');
});
