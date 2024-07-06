const { google } = require("googleapis");
require("dotenv").config();
const fetch = require("node-fetch");
const fs = require("fs");
const path = require("path");

const oauth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  process.env.REDIRECT_URI
);

const TOKEN_PATH = path.join(__dirname, "tokens.json");

const updateVercelEnv = async (refreshToken) => {
  const response = await fetch(
    `https://api.vercel.com/v9/projects/${process.env.VERCEL_PROJECT_ID}/env`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.VERCEL_API_TOKEN}`,
      },
      body: JSON.stringify({
        key: "REFRESH_TOKEN",
        value: refreshToken,
        target: ["production"],
      }),
    }
  );

  if (!response.ok) {
    console.error(
      "Failed to update Vercel environment variable:",
      await response.text()
    );
  } else {
    console.log("Vercel environment variable updated successfully");
  }
};

module.exports = async (req, res) => {
  try {
    const tokens = JSON.parse(fs.readFileSync(TOKEN_PATH));
    oauth2Client.setCredentials(tokens);

    const newTokens = await oauth2Client.refreshAccessToken();
    console.log("New tokens:", newTokens.credentials);

    // Update the tokens file with the new tokens
    fs.writeFileSync(TOKEN_PATH, JSON.stringify(newTokens.credentials));
    console.log("Tokens updated in", TOKEN_PATH);

    // Update Vercel environment variable
    await updateVercelEnv(newTokens.credentials.refresh_token);

    res
      .status(200)
      .send("Tokens refreshed and Vercel environment updated successfully");
  } catch (error) {
    console.error("Error refreshing access token:", error);
    res.status(500).send("Failed to refresh tokens");
  }
};
