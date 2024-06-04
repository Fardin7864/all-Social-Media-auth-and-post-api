const express = require('express');
const axios = require('axios');
const multer = require('multer');
const fs = require('fs');
const cookieParser = require('cookie-parser');
const FormData = require('form-data');
const { getAuthUrl, getAccessToken, generateToken, verifyToken } = require('./auth');
require('dotenv').config();

const app = express();
const upload = multer({ dest: 'uploads/' });

app.use(cookieParser());
app.use('/public', express.static('public'));

app.get('/auth', (req, res) => {
    res.redirect(getAuthUrl());
});

app.get('/', async (req, res) => {
    const { code } = req.query;
    if (code) {
        try {
            const accessToken = await getAccessToken(code);
            const token = generateToken({ accessToken });
            res.cookie('jwt', token, { httpOnly: true });
            res.redirect('/public/index.html');
        } catch (error) {
            res.status(500).send('Authentication failed');
        }
    } else {
        res.redirect('/public/index.html');
    }
});

app.post('/post', upload.single('video'), async (req, res) => {
    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }

    const token = req.cookies.jwt;
    const payload = verifyToken(token);

    if (!payload) {
        return res.status(401).send('User not authenticated');
    }

    try {
        const { accessToken } = payload;
        const videoPath = req.file.path;
        const formData = new FormData();
        formData.append('video', fs.createReadStream(videoPath));

        const response = await axios.post('https://open-api.tiktok.com/video/upload/', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
                'Authorization': `Bearer ${accessToken}`
            }
        });

        res.send('Video posted successfully');
    } catch (error) {
        res.status(500).send('Error posting video');
    }
});

app.listen(3000, () => {
    console.log('Server started on http://localhost:3000');
});
