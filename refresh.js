const { google } = require("googleapis");
require("dotenv").config();

const oauth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  process.env.REDIRECT_URI
);

const getTokens = async () => {
  const res = await oauth2Client.getToken(
    "4/0ATx3LY7zONaXdrHoHtAFMI_3skHhn342Qh8d7eO1hEPnUwaX9Aa76v-YipIN1i6FObWe0Q"
  );
  console.log(res.tokens);
};

getTokens();
