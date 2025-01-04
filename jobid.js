const axios = require('axios');

const API_KEY = 'GwvXpGxiynxdx4D6Drbn8qNBMKDClOvto5LBPKi95GQ=';
const ENDPOINT = 'https://api.cron-job.org/jobs';

async function getJobs() {
  try {
    const response = await axios({
      method: 'get',
      url: ENDPOINT,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      }
    });

    console.log('Response Status:', response.status);
    console.log('Response Headers:', response.headers);
    console.log('Full Response Data:', JSON.stringify(response.data, null, 2));

    const jobs = response.data.jobs;
    
    if (Array.isArray(jobs)) {
      console.log('\nJob IDs:');
      jobs.forEach(job => {
        console.log(job.jobId);
      });
    } else {
      console.log('Unexpected response structure. Unable to find jobs array.');
    }

  } catch (error) {
    console.error('Error fetching jobs:');
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('Response Status:', error.response.status);
      console.error('Response Headers:', error.response.headers);
      console.error('Response Data:', error.response.data);
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received:', error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Error:', error.message);
    }
  }
}

getJobs();