## youtube-title-views-updater

<img width="952" alt="youtube" src="https://github.com/WilsonLimSet/youtube-title-views-updater/assets/78862507/c6815f70-70ce-4ec8-81ae-5587a1c10313">

### Setup

Follow these steps to set up the project:

1. Follow the instructions in this guide to create OAuth tokens in Google Cloud for the YouTube Data API: [Create OAuth Tokens](https://www.ryancarmody.dev/blog/create-oauth-tokens-in-google-cloud-for-youtube-data-api).
2. Continue following the guide until step 7: [Replicate Tom Scott's "This Video Has X Views" Videos with Node.js](https://www.ryancarmody.dev/blog/replicate-tom-scotts-this-video-has-x-views-videos-with-nodejs#step-5-generate-an-auth-url).
3. Clone this repository and create your own `.env` file with the necessary environment variables.
4. Update the video ID in `updatetitle.js` with your own video ID.
5. Deploy the project to Vercel.
6. Create a cron job on [cron-job.org](https://cron-job.org/). The URL for the cron job should be `https://yourvercel.app/api/updatetitile`.
7. Enjoy!

### Maintenance

Every week after the refresh token expires:

1. Run `main.js` to get a new refresh token.
2. Copy the new refresh token.
3. Update the refresh token in Vercel's environment variables.
4. Redeploy your Vercel instance.
5. Re-enable the cron job.
