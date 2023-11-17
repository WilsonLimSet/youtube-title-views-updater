## youtube-title-views-updater

How to achieve the same functionality for free:

1. Follow - https://www.ryancarmody.dev/blog/create-oauth-tokens-in-google-cloud-for-youtube-data-api
2. Follow until step 7 -  https://www.ryancarmody.dev/blog/replicate-tom-scotts-this-video-has-x-views-videos-with-nodejs#step-5-generate-an-auth-url
3. Git Clone this repo with your own .ENV
4. Change the video ID in updatetitle.js
5. Deploy to vercel
6. Create a CronJob on - https://cron-job.org/, the url is your https://yourvercel.app/api/updatetitile
7. Enjoy
