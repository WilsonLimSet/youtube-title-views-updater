const { google } = require("googleapis");
require("dotenv").config();

const oauth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  process.env.REDIRECT_URI
);

const generateAuthUrl = async () => {
  const scopes = [
    "https://www.googleapis.com/auth/youtube",
  ];

  const url = await oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: scopes,
  });

  console.log(url);
};

generateAuthUrl();