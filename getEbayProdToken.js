require('dotenv').config();
const axios = require('axios');
const qs = require('querystring');

const getSandboxToken = async () => {
  const clientId = process.env.EBAY_CLIENT_ID;
  const clientSecret = process.env.EBAY_CLIENT_SECRET;

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  try {
    const response = await axios.post(
      'https://api.sandbox.ebay.com/identity/v1/oauth2/token',
      qs.stringify({
        grant_type: 'client_credentials',
        scope: process.env.EBAY_SCOPE,
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${credentials}`,
        },
      }
    );

    console.log('✅ Sandbox App Token:', response.data.access_token);
    console.log('Expires in seconds:', response.data.expires_in);
  } catch (err) {
    console.error('❌ Sandbox Token Error:', err.response?.data || err.message);
  }
};

getSandboxToken();

