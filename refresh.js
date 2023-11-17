const { google } = require("googleapis");
require("dotenv").config();

const oauth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  process.env.REDIRECT_URI
);

const getTokens = async () => {
  const res = await oauth2Client.getToken(
    "4/0AfJohXm2zbnozOSFcLrxg6eYsLqTKwYxAtY0BenDLMP5PNFvdEC081wATbVbmOQ0gpWwww"
  );
  console.log(res.tokens);
};

getTokens();