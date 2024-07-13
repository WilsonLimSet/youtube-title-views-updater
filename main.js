const { google } = require("googleapis");
require("dotenv").config();
const http = require("http");
const url = require("url");
const fs = require("fs");
const path = require("path");
const axios = require("axios");

const oauth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  process.env.REDIRECT_URI
);

const TOKEN_PATH = path.join(__dirname, "tokens.json");
const vercelToken = process.env.VERCEL_API_TOKEN;
const projectId = "prj_shRDnGbGwF61KAes9phHPcbU5IDs";

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

    // Update Vercel environment variable
    await updateVercelEnvVariable(tokens.refresh_token);
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

    // Check if the access token has expired
    const currentTime = Date.now();
    if (currentTime >= tokens.expiry_date) {
      console.log("Access token has expired. Refreshing...");
      oauth2Client.setCredentials(tokens);

      const newTokens = await oauth2Client.refreshAccessToken();
      console.log("New tokens:", newTokens.credentials);

      // Update the tokens file with the new tokens
      fs.writeFileSync(TOKEN_PATH, JSON.stringify(newTokens.credentials));
      console.log("Tokens updated in", TOKEN_PATH);

      // Update Vercel environment variable
      await updateVercelEnvVariable(newTokens.credentials.refresh_token);
    } else {
      console.log("Access token is still valid. No need to refresh.");
      // You might want to update the Vercel environment variable here as well,
      // in case it wasn't updated in a previous run
      await updateVercelEnvVariable(tokens.refresh_token);
    }
  } catch (error) {
    console.error("Error refreshing access token:", error);
  }
};
async function updateVercelEnvVariable(refreshToken) {
  const deploymentId = "8aobsBDDVo4nBuX9TSnY6oGn7WgV";
  const projectName = "youtube-views-title-update";

  try {
    // First, get the existing environment variables
    const getEnvResponse = await axios({
      method: "get",
      url: `https://api.vercel.com/v9/projects/${projectId}/env`,
      headers: {
        Authorization: `Bearer ${vercelToken}`,
      },
    });

    // Find the REFRESH_TOKEN environment variable
    const refreshTokenEnv = getEnvResponse.data.envs.find(
      (env) => env.key === "REFRESH_TOKEN"
    );

    if (!refreshTokenEnv) {
      throw new Error("REFRESH_TOKEN environment variable not found");
    }

    // Check if the new refresh token is different from the current one
    if (refreshTokenEnv.value !== refreshToken) {
      // Update the existing environment variable
      const updateResponse = await axios({
        method: "patch",
        url: `https://api.vercel.com/v9/projects/${projectId}/env/${refreshTokenEnv.id}`,
        headers: {
          Authorization: `Bearer ${vercelToken}`,
          "Content-Type": "application/json",
        },
        data: {
          value: refreshToken,
        },
      });

      console.log(
        "Vercel environment variable updated successfully:",
        updateResponse.data
      );

      // Redeploy the specified deployment
      const redeployResponse = await axios({
        method: "post",
        url: `https://api.vercel.com/v13/deployments`,
        headers: {
          Authorization: `Bearer ${vercelToken}`,
          "Content-Type": "application/json",
        },
        data: {
          name: projectName,
          deploymentId: deploymentId,
        },
      });

      console.log(
        "Redeployment triggered successfully:",
        redeployResponse.data
      );
    } else {
      console.log("Refresh token unchanged. Skipping redeployment.");
    }
  } catch (error) {
    console.error(
      "Error in Vercel operations:",
      error.response ? error.response.data : error.message
    );
  }
}

// Main execution
if (fs.existsSync(TOKEN_PATH)) {
  refreshAccessToken();
} else {
  generateAuthUrl();
  startServer();
}
