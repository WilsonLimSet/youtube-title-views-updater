const { google } = require("googleapis");
require("dotenv").config();
const CronJob = require("cron").CronJob;

const express = require("express");
const app = express();
const port = process.env.PORT || 4000;

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});

const oauth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  process.env.REDIRECT
);

const updateVideo = async () => {
  oauth2Client.setCredentials({ refresh_token: process.env.REFRESH_TOKEN });

  // YouTube client
  const youtube = google.youtube({
    version: "v3",
    auth: oauth2Client,
  });

  try {
    // Get video
    const result = await youtube.videos.list({
      id: "vV4g1nNbBNg", // <-- ID of video
      part: "statistics,snippet",
    });

    if (result.data.items.length > 0) {
      const stats = result.data.items[0].statistics;

      await youtube.videos.update({
        part: "snippet",
        requestBody: {
          id: "vV4g1nNbBNg",
          snippet: {
            title: `This video has ${stats.viewCount} views and ${stats.dislikeCount} dislikes.`,
            categoryId: 28,
          },
        },
      });
    }
  } catch (error) {
    console.log(error);
  }
};

const updateEvery5Mins = new CronJob("*/5 * * * * *", async () => {
  updateVideo();
});

updateEvery5Mins.start();

app.get('/update-video', async (req, res) => {
    try {
      await updateVideo();
      res.send('Video updated successfully');
    } catch (error) {
      console.error(error);
      res.status(500).send('Failed to update video');
    }
  });
  