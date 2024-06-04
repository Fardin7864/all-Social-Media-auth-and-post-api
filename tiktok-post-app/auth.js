const axios = require('axios');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const getAuthUrl = () => {
    const { TOC_CLIENT_ID, TOC_REDIRECT_URI } = process.env;
    return `https://www.tiktok.com/auth/authorize?client_id=${TOC_CLIENT_ID}&redirect_uri=${TOC_REDIRECT_URI}&response_type=code&scope=user.info.basic,video.upload`;
};

const getAccessToken = async (code) => {
    const { TOC_CLIENT_ID, TOC_CLIENT_SECRET, TOC_REDIRECT_URI } = process.env;
    const response = await axios.post('https://open-api.tiktok.com/oauth/access_token/', {
        client_key: TOC_CLIENT_ID,
        client_secret: TOC_CLIENT_SECRET,
        code,
        grant_type: 'authorization_code',
        redirect_uri: TOC_REDIRECT_URI
    });

    return response.data.data.access_token;
};

const generateToken = (data) => {
    return jwt.sign(data, process.env.JWT_SECRET, { expiresIn: '1h' });
};

const verifyToken = (token) => {
    try {
        return jwt.verify(token, process.env.JWT_SECRET);
    } catch (e) {
        return null;
    }
};

module.exports = { getAuthUrl, getAccessToken, generateToken, verifyToken };
