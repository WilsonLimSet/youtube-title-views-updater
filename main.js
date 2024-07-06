const { google } = require("googleapis");
require("dotenv").config();
const http = require("http");
const url = require("url");
const fs = require("fs");
const path = require("path");

const oauth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  process.env.REDIRECT_URI
);

const TOKEN_PATH = path.join(__dirname, "tokens.json");

const generateAuthUrl = async () => {
  const scopes = ["https://www.googleapis.com/auth/youtube"];

  const authUrl = await oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: scopes,
  });

  console.log("Visit this URL to authorize the application:", authUrl);
};

const getTokens = async (code) => {
  try {
    const { tokens } = await oauth2Client.getToken(code);
    console.log("Tokens received:", tokens);

    // Save the tokens to a file
    fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens));
    console.log("Tokens saved to", TOKEN_PATH);
  } catch (error) {
    console.error("Error retrieving tokens:", error);
  }
};

const startServer = () => {
  const server = http.createServer((req, res) => {
    if (req.url.startsWith("/callback")) {
      const queryObject = url.parse(req.url, true).query;
      const code = queryObject.code;
      console.log("Authorization code:", code);

      res.writeHead(200, { "Content-Type": "text/plain" });
      res.end("Authorization code received. You can close this window.");

      // Get tokens using the authorization code
      getTokens(code).then(() => {
        // Close the server after receiving the tokens
        server.close();
      });
    }
  });

  server.listen(3000, () => {
    console.log("Server is listening on port 3000");
  });
};

const refreshAccessToken = async () => {
  try {
    const tokens = JSON.parse(fs.readFileSync(TOKEN_PATH));
    if (!tokens.refresh_token) {
      throw new Error("No refresh token found in stored tokens.");
    }
    oauth2Client.setCredentials(tokens);

    const newTokens = await oauth2Client.refreshAccessToken();
    console.log("New tokens:", newTokens.credentials);

    // Update the tokens file with the new tokens
    fs.writeFileSync(TOKEN_PATH, JSON.stringify(newTokens.credentials));
    console.log("Tokens updated in", TOKEN_PATH);
  } catch (error) {
    console.error("Error refreshing access token:", error);
  }
};

if (fs.existsSync(TOKEN_PATH)) {
  refreshAccessToken();
} else {
  generateAuthUrl();
  startServer();
}
