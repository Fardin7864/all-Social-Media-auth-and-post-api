const express = require('express');
const SocialPost = require('social-post-api');

const app = express();
const PORT = process.env.PORT || 3000;

// Live API Key
const social = new SocialPost("T988C9E-JXSMDAM-H4V0KDS-2A1BXWJ");

// Middleware to parse JSON bodies
app.use(express.json());

// Basic route
app.get('/', (req, res) => {
  res.send('Hello, world!');
});

// Route to post to social media
app.post('/post', async (req, res) => {
  const { post, platforms, mediaUrls } = req.body;
  
  try {
    const response = await social.post({
      post,
      platforms,
      mediaUrls,
    });
    res.json(response);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to post to social media' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
