// File: /api/update-video.js
const { google } = require('googleapis');
require('dotenv').config();

module.exports = async (req, res) => {
  const oauth2Client = new google.auth.OAuth2(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
    process.env.REDIRECT
  );

  oauth2Client.setCredentials({ refresh_token: process.env.REFRESH_TOKEN });

  const youtube = google.youtube({
    version: 'v3',
    auth: oauth2Client,
  });

  try {
    const result = await youtube.videos.list({
      id: "PA2GKru3GT8", // Your video ID here
      part: "statistics,snippet",
    });

    if (result.data.items.length > 0) {
      const stats = result.data.items[0].statistics;

      await youtube.videos.update({
        part: "snippet",
        requestBody: {
          id: "PA2GKru3GT8", // Your video ID here
          snippet: {
            title: `This video has ${stats.viewCount} views and ${stats.dislikeCount} dislikes`,
            categoryId: '28', // Make sure this category ID is correct
          },
        },
      });

      res.status(200).send('Video updated successfully');
    } else {
      res.status(404).send('No video found');
    }
  } catch (error) {
    console.error(error);
    res.status(500).send('Failed to update video');
  }
};
