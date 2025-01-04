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

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: scopes,
    prompt: "consent", // This forces a new refresh token to be generated
  });

  console.log("Visit this URL to authorize the application:", authUrl);
  return authUrl;
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

    oauth2Client.setCredentials(tokens);

    try {
      const newTokens = await oauth2Client.refreshAccessToken();
      console.log("New tokens:", newTokens.credentials);

      // Update the tokens file with the new tokens
      fs.writeFileSync(TOKEN_PATH, JSON.stringify(newTokens.credentials));
      console.log("Tokens updated in", TOKEN_PATH);

      // Update Vercel environment variable
      await updateVercelEnvVariable(newTokens.credentials.refresh_token);
    } catch (refreshError) {
      if (refreshError.message.includes("invalid_grant")) {
        console.log(
          "Refresh token is invalid or expired. Restarting authentication process."
        );
        await restartAuthProcess();
      } else {
        throw refreshError;
      }
    }
  } catch (error) {
    console.error("Error refreshing access token:", error);
  }
};

const restartAuthProcess = async () => {
  console.log("Restarting authentication process...");

  // Delete the existing tokens file
  if (fs.existsSync(TOKEN_PATH)) {
    fs.unlinkSync(TOKEN_PATH);
  }

  // Generate a new auth URL
  await generateAuthUrl();

  // Start the server to handle the callback
  startServer();
};

async function updateVercelEnvVariable(refreshToken) {
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

      // Fetch project details to get the repoId
      const projectResponse = await axios({
        method: "get",
        url: `https://api.vercel.com/v9/projects/${projectId}`,
        headers: {
          Authorization: `Bearer ${vercelToken}`,
        },
      });

      const repoId = projectResponse.data.link.repoId;

      // Create a new deployment
      const createDeploymentResponse = await axios({
        method: "post",
        url: `https://api.vercel.com/v13/deployments`,
        headers: {
          Authorization: `Bearer ${vercelToken}`,
          "Content-Type": "application/json",
        },
        data: {
          name: projectName,
          project: projectId,
          target: "production",
          gitSource: {
            type: "github",
            repo: "wilsonlimset/youtube-views-title-updater", // Replace with your actual GitHub repo
            ref: "main", // Or whichever branch you want to deploy
            repoId: repoId,
          },
        },
      });

      console.log(
        "New deployment created successfully:",
        createDeploymentResponse.data
      );
      // Wait for 30 seconds to ensure deployment is complete
      await new Promise((resolve) => setTimeout(resolve, 30000));

      // Enable the cron job
      await enableCronJob();
    } else {
      console.log("Refresh token unchanged. Skipping update and deployment.");
    }
  } catch (error) {
    console.error(
      "Error in Vercel operations:",
      error.response ? error.response.data : error.message
    );
  }
}

const checkTokens = () => {
  try {
    const tokens = JSON.parse(fs.readFileSync(TOKEN_PATH));
    console.log("Access Token:", tokens.access_token.substring(0, 10) + "...");
    console.log(
      "Refresh Token:",
      tokens.refresh_token.substring(0, 10) + "..."
    );
    console.log("Expiry Date:", new Date(tokens.expiry_date).toLocaleString());

    // Set the credentials
    oauth2Client.setCredentials(tokens);

    console.log("Tokens loaded and set successfully");
  } catch (error) {
    console.error("Error checking tokens:", error);
  }
};

async function enableCronJob() {
  const API_KEY = process.env.CRON_JOB_API_KEY;
  const JOB_ID = "4696589"; // Replace with your actual job ID
  const ENDPOINT = `https://api.cron-job.org/jobs/${JOB_ID}`;

  const headers = {
    Authorization: `Bearer ${API_KEY}`,
    "Content-Type": "application/json",
  };

  const payload = {
    job: {
      enabled: true,
    },
  };

  try {
    const response = await axios.patch(ENDPOINT, payload, { headers });

    if (response.status === 200) {
      console.log(`Job ${JOB_ID} enabled successfully!`);
    } else {
      console.log(`Failed to enable job. Status code: ${response.status}`);
      console.log(`Response: ${response.data}`);
    }
  } catch (error) {
    console.error(
      "Error enabling cron job:",
      error.response ? error.response.data : error.message
    );
  }
}

// Main execution
(async () => {
  if (fs.existsSync(TOKEN_PATH)) {
    checkTokens();
    await refreshAccessToken();
  } else {
    await restartAuthProcess();
    // Wait for 30 seconds after deployment before enabling the cron job
    setTimeout(enableCronJob, 30000);
  }
})();
